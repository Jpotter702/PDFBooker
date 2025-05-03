from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from celery import Celery
import shutil
import os
import uuid
from typing import List, Dict, Any, Optional
import pikepdf
from pikepdf import Pdf, Page
import tempfile
from io import BytesIO

app = FastAPI()
celery_app = Celery(
    'worker',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0'),
)

OUTPUT_DIR = os.getenv('OUTPUT_DIR', '/app/output')
PUBLIC_URL_BASE = os.getenv('PUBLIC_URL_BASE', 'http://localhost:8000/files')

@celery_app.task(name='merge_pdfs')
def merge_pdfs(file_paths, job_id, user_id=None):
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Output file path
    output_filename = f"{job_id}.pdf"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Debug information
    print(f"Received file_paths: {file_paths}")
    print(f"Processing job_id: {job_id}")
    
    # If the paths are in /tmp but should be in OUTPUT_DIR
    fixed_paths = []
    for path in file_paths:
        if path.startswith("/tmp"):
            # Extract the job ID from the path
            parts = path.split('/')
            if len(parts) >= 3:
                tmp_job_id = parts[2]
                filename = parts[-1]
                new_path = os.path.join(OUTPUT_DIR, f"tmp_{tmp_job_id}", filename)
                print(f"Fixing path: {path} -> {new_path}")
                fixed_paths.append(new_path)
            else:
                fixed_paths.append(path)
        else:
            fixed_paths.append(path)
    
    if fixed_paths != file_paths:
        print(f"Using fixed paths: {fixed_paths}")
        file_paths = fixed_paths
    
    try:
        # Merge PDFs
        merged_pdf = Pdf.new()
        
        # Track total pages for page numbering
        total_pages = 0
        for pdf_path in file_paths:
            print(f"Opening PDF: {pdf_path}")
            with Pdf.open(pdf_path) as pdf:
                total_pages += len(pdf.pages)
                merged_pdf.pages.extend(pdf.pages)
        
        # Check if user has Pro subscription - this determines if we add watermarks
        is_pro = user_id and is_pro_user(user_id)
        
        # Add page numbers and watermark (if not Pro)
        for i, page in enumerate(merged_pdf.pages):
            # Create a new PDF with just one page for annotation
            with pikepdf.Pdf.new() as canvas:
                canvas.add_blank_page(page.mediabox)
                page_canvas = canvas.pages[0]
                
                # Get page dimensions
                width = float(page.mediabox[2])
                height = float(page.mediabox[3])
                
                # Add page number at the bottom center
                page_number_str = f"{i+1} / {total_pages}"
                
                # Create and add text annotation
                page_canvas.add_overlay(page)
                
                # Advanced page numbering for Pro users
                if is_pro:
                    # Pro users get more elegant page numbering placement and formatting
                    number_position_x = width / 2 - 15
                    number_position_y = 20
                    number_font_size = 10
                else:
                    # Free users get basic page numbering
                    number_position_x = width / 2 - 20
                    number_position_y = 15
                    number_font_size = 8
                
                # Create a temporary stream for the page number
                with BytesIO() as stream:
                    temp_pdf = pikepdf.Pdf.new()
                    font = pikepdf.Name.Helvetica
                    stream.write(f"q BT /F1 {number_font_size} Tf {number_position_x} {number_position_y} Td ({page_number_str}) Tj ET Q".encode())
                    temp_pdf.add_blank_page(page.mediabox)
                    
                    # Add text to page
                    merged_pdf.pages[i].add_overlay(page_canvas)
                
                # Add watermark for free users
                if not is_pro and i % 2 == 0:  # Add watermark on every other page
                    with BytesIO() as stream:
                        watermark_text = "PDFBooker Free - Upgrade to Pro to remove"
                        # Diagonal watermark
                        stream.write(f"q BT /F1 12 Tf 0.9 0 0 0.9 {width/4} {height/2} Tm 30 rotate ({watermark_text}) Tj ET Q".encode())
                        merged_pdf.pages[i].add_overlay(canvas.pages[0])
        
        # Save the merged PDF
        merged_pdf.save(output_path)
        
        # Clean up original files
        for pdf_path in file_paths:
            try:
                os.remove(pdf_path)
            except Exception as e:
                print(f"Warning: Could not remove file {pdf_path}: {str(e)}")
                
        # Clean up temp directory if it exists
        try:
            import shutil
            # Extract the directory from the first file path
            if file_paths and len(file_paths) > 0:
                temp_dir = os.path.dirname(file_paths[0])
                if temp_dir and temp_dir.startswith(OUTPUT_DIR) and 'tmp_' in temp_dir:
                    shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception as e:
            print(f"Warning: Could not clean up temp directory: {str(e)}")
        
        # Generate public URL
        public_url = f"{PUBLIC_URL_BASE}/{output_filename}"
        
        return {
            "status": "completed",
            "job_id": job_id,
            "url": public_url,
            "pages": total_pages,
            "is_pro": is_pro
        }
    
    except Exception as e:
        # Log the error
        print(f"Error processing PDF merge job {job_id}: {str(e)}")
        return {
            "status": "failed",
            "job_id": job_id,
            "error": str(e)
        }

@app.post("/merge")
async def merge_pdfs_endpoint(files: List[UploadFile] = File(...)):
    job_id = str(uuid.uuid4())
    # Store files in the shared output directory instead of /tmp
    job_dir = os.path.join(OUTPUT_DIR, f"tmp_{job_id}")
    os.makedirs(job_dir, exist_ok=True)
    
    file_paths = []
    for f in files:
        dest = os.path.join(job_dir, f.filename)
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(f.file, buffer)
        file_paths.append(dest)
    # Enqueue Celery job
    task = celery_app.send_task('merge_pdfs', args=[file_paths, job_id])
    return JSONResponse({"job_id": job_id, "task_id": task.id})

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mock function to check if a user has a Pro subscription
# In a real application, this would query a database or an external service
def is_pro_user(user_id: str) -> bool:
    # For testing, let's say users with IDs ending in 0, 1, 2, 3, 4 are Pro users
    return user_id.endswith(('0', '1', '2', '3', '4'))
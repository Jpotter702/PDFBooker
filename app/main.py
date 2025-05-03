from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from celery import Celery
import shutil
import os
import uuid
from typing import List, Dict, Any, Optional

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory if it doesn't exist
OUTPUT_DIR = os.getenv('OUTPUT_DIR', '/app/output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount the output directory for file downloads
app.mount("/files", StaticFiles(directory=OUTPUT_DIR), name="files")

celery_app = Celery(
    'worker',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
)

@app.post("/merge")
async def merge_pdfs(
    files: List[UploadFile] = File(...),
    userId: Optional[str] = Form(None)
):
    if not files:
        raise HTTPException(status_code=400, detail="No PDF files uploaded")
    
    # Calculate total size of all files
    total_size = 0
    for file in files:
        file_content = await file.read()
        total_size += len(file_content)
        # Reset file position for later reading
        await file.seek(0)
    
    # Check file size limit based on user subscription
    # Non-authenticated users and free users are limited to 20MB
    if not userId or not is_pro_user(userId):
        if total_size > 20 * 1024 * 1024:  # 20MB
            raise HTTPException(
                status_code=403, 
                detail="File size exceeds the 20MB limit for free users. Please upgrade to Pro."
            )
        if len(files) > 3:
            raise HTTPException(
                status_code=403,
                detail="Free users can only merge up to 3 files. Please upgrade to Pro."
            )
    else:
        # Pro users are limited to 100MB
        if total_size > 100 * 1024 * 1024:  # 100MB
            raise HTTPException(
                status_code=403,
                detail="File size exceeds the 100MB limit for Pro users."
            )
    
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
    
    # Add user ID to the job if provided
    task_kwargs = {}
    if userId:
        task_kwargs["user_id"] = userId
    
    # Log file paths for debugging
    print(f"Sending file paths to worker: {file_paths}")
    
    # Enqueue Celery job
    task = celery_app.send_task('merge_pdfs', args=[file_paths, job_id], kwargs=task_kwargs)
    
    return JSONResponse({
        "job_id": job_id,
        "task_id": task.id,
        "status": "processing"
    })

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    # Check if task exists for this job
    task = celery_app.AsyncResult(job_id)
    
    if task.state == 'PENDING':
        return {"status": "pending", "job_id": job_id}
    elif task.state == 'FAILURE':
        return {
            "status": "failed",
            "job_id": job_id,
            "error": str(task.info)
        }
    elif task.state == 'SUCCESS':
        result = task.get()
        return {
            "status": result.get("status", "completed"),
            "job_id": job_id,
            "url": result.get("url"),
            "pages": result.get("pages"),
            "error": result.get("error")
        }
    else:
        return {"status": "processing", "job_id": job_id}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mock function to check if a user has a Pro subscription
# In a real application, this would query a database or an external service
def is_pro_user(user_id: str) -> bool:
    # For testing, let's say users with IDs ending in 0, 1, 2, 3, 4 are Pro users
    return user_id.endswith(('0', '1', '2', '3', '4'))
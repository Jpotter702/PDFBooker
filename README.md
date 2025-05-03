# PDFBooker

PDFBooker is a web service for merging multiple PDF files into one document with automatic page numbering. It features both free and premium plans with advanced options.

## Features

- Upload and merge multiple PDF files
- Automatic page numbering
- Authentication with Clerk
- Free and Pro subscription plans with Stripe
- Backend processing with FastAPI and Celery
- Frontend with Next.js 15 and React 19
- Docker containerization for easy deployment

## System Architecture

PDFBooker consists of several components:

- **Web Frontend**: Next.js 15 application with React 19 components
- **API Server**: FastAPI application handling file uploads and job status
- **Worker**: Celery worker for background PDF processing
- **Database**: PostgreSQL for storing user data and job information
- **Redis**: Message broker for Celery tasks
- **Monitoring**: Flower for Celery task monitoring
- **Routing**: Traefik for HTTP routing and SSL termination

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pdfbooker.git
   cd pdfbooker
   ```

2. Create environment files:
   ```bash
   # Copy the example environment file
   cp web/.env.local.example web/.env.local
   # Edit with your actual API keys for Clerk and Stripe
   ```

3. Start the application stack:
   ```bash
   docker-compose up
   ```

4. Access the application:
   - Web interface: http://localhost:3000
   - API server: http://localhost:8000
   - Flower monitoring: http://localhost:5555
   - Traefik dashboard: http://localhost:8080

### Development Setup

#### Backend (FastAPI)

1. Create a virtual environment:
   ```bash
   cd app
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Run the development server:
   ```bash
   python -m uvicorn main:app --reload
   ```

#### Worker (Celery)

1. Create a virtual environment:
   ```bash
   cd worker
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Run the worker:
   ```bash
   celery -A main.celery_app worker --loglevel=info
   ```

#### Frontend (Next.js)

1. Install dependencies:
   ```bash
   cd web
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Subscription Plans

PDFBooker offers two subscription plans:

### Free Plan
- Merge up to 3 PDFs
- Files up to 20MB total
- Basic page numbering
- Watermarks on output

### Pro Plan ($9/month)
- Unlimited PDF merges
- Files up to 100MB total
- Advanced page numbering options
- No watermarks on output

## API Endpoints

- `POST /merge`: Upload and merge PDF files
- `GET /status/{job_id}`: Check the status of a merge job
- `GET /files/{file_name}`: Download a merged PDF

## Technology Stack

### Backend
- **FastAPI 0.103.1**: Modern, high-performance web framework for building APIs
- **Uvicorn 0.23.2**: ASGI server for FastAPI
- **Celery 5.3.4**: Distributed task queue for background processing
- **PostgreSQL 14**: Relational database for persistent storage
- **Redis 5.0.1**: In-memory data store for Celery broker and result backend
- **PikePDF 8.5.1**: Python library for PDF manipulation

### Frontend
- **Next.js 15.3**: React framework for production-grade applications
- **React 19.1**: JavaScript library for building user interfaces
- **Clerk**: Complete authentication and user management solution
- **Stripe**: Payment processing platform for subscription management
- **TailwindCSS 3.3**: Utility-first CSS framework for rapid UI development

## Troubleshooting

### Docker Deployment Issues

If you encounter issues with the services not starting properly:

1. Check container logs:
   ```bash
   docker-compose logs app
   docker-compose logs worker
   docker-compose logs web
   ```

2. Ensure environment variables are correctly set in the .env files or docker-compose.yaml

3. For Uvicorn-related errors:
   - The system uses `python -m uvicorn` instead of direct uvicorn command to resolve asyncio-related issues
   - Make sure the PYTHONUNBUFFERED environment variable is set to 1

### Database Connectivity

If the app cannot connect to the database:

1. Ensure the PostgreSQL container is running:
   ```bash
   docker-compose ps db
   ```

2. Check database logs:
   ```bash
   docker-compose logs db
   ```

3. Verify that the `DATABASE_URL` environment variable in docker-compose.yaml is correct

## License

This project is licensed under the MIT License - see the LICENSE file for details.
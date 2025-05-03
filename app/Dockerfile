FROM python:3.11-slim

WORKDIR /app

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ .

ENV PORT=${PORT:-8000}
ENV OUTPUT_DIR=/app/output
EXPOSE $PORT
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]

EXPOSE 8000

HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1
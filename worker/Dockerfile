# ---- Base image ----
FROM python:3.11-slim AS base

# System deps for pikepdf and general build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libjpeg-dev \
    libopenjp2-7-dev \
    libpq-dev \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    liblzma-dev \
    libz-dev \
    libglib2.0-0 \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Install dependencies ----
FROM base AS builder

COPY worker/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt

# ---- Final image ----
FROM python:3.11-slim AS final

# Only copy what is needed for runtime
COPY --from=builder /install /usr/local
COPY worker/ /app
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PATH="/usr/local/bin:$PATH"

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Expose ports for FastAPI
EXPOSE 8000

# Healthcheck (optional)
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

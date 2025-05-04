# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- Start all services: `docker-compose up`
- Run individual service: `docker-compose up <service-name>` (app/worker/web)
- Install Python dependencies: `pip install -r <service>/requirements.txt`
- Run FastAPI server: `uvicorn main:app --reload`

## Code Style
- Follow PEP 8 guidelines for Python code
- Use type hints for all function parameters and return values
- Import order: standard library → third-party packages → local modules
- Use 4 spaces for indentation (no tabs)
- Limit line length to 88 characters
- Use descriptive variable names in snake_case
- Implement proper error handling with specific exceptions
- Document functions with docstrings ("""Description.""")
- Keep functions focused and small (single responsibility)
- Use environment variables for configuration
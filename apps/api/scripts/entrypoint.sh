#!/bin/sh

# Start the FastAPI application
uvicorn api.main:app --host 0.0.0.0 --port 8000 --no-server-header --no-date-header
#!/bin/sh

# Run migrations
alembic upgrade head

uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers $(nproc)
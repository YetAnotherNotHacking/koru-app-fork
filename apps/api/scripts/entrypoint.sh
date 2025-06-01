#!/bin/sh

# Run migrations
alembic upgrade head

export FORWARDED_ALLOW_IPS='*'

uvicorn api.main:app --host 0.0.0.0 --port 8000 --proxy-headers --no-server-header --no-date-header --workers $(nproc)
FROM python:3.12-alpine

WORKDIR /app

# Copy dependency files
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/
COPY apps/api/pyproject.toml apps/api/uv.lock ./

# Install dependencies
RUN uv sync --no-dev --locked

# Copy application code
COPY apps/api/api/ api/

# Set up environment
ENV PATH="/app/.venv/bin:$PATH"

# Copy and set up entrypoint
COPY apps/api/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

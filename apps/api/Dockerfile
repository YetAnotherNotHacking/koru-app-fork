FROM python:3.12-alpine

WORKDIR /app

ENV DATABASE_URL="sqlite:///./database.db"

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

COPY apps/api/pyproject.toml apps/api/uv.lock ./
COPY apps/api/api/ api/

RUN uv sync --no-dev --locked

ENV PATH="/app/.venv/bin:$PATH"

COPY apps/api/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY apps/api/alembic.ini .
COPY apps/api/migrations/ migrations/

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

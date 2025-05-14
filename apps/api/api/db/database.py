from collections.abc import Generator

from sqlmodel import Session, create_engine

from api.core.config import settings

# For synchronous engine (e.g., with psycopg2)
engine = create_engine(settings.DATABASE_URL, echo=True)  # echo=True for logging SQL
# If we were using an async driver like asyncpg:
# from sqlmodel.ext.asyncio.session import AsyncEngine
# engine = AsyncEngine(create_engine(settings.DATABASE_URL, echo=True))


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency to get a database session.
    Ensures the session is closed after the request.
    """
    with Session(engine) as session:
        yield session

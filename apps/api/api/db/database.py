from sqlmodel import Session, SQLModel, create_engine

from api.core.config import settings

# Create database engine
engine = create_engine(settings.DATABASE_URL, echo=True)


def create_db_and_tables():
    """Create database and tables"""
    SQLModel.metadata.create_all(engine)


def get_db():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session

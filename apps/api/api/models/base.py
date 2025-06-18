from datetime import UTC, datetime

from pydantic import ConfigDict
from sqlalchemy import func
from sqlmodel import Field, SQLModel


class BaseModel(SQLModel):
    model_config = ConfigDict(use_enum_values=True)  # type: ignore

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={
            "server_default": func.now(),
        },
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
        },
        nullable=False,
    )

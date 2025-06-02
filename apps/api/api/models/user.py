from typing import TYPE_CHECKING

from nanoid import generate
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel

if TYPE_CHECKING:
    from .connection import Connection
    from .counterparty import Counterparty


class UserBase(SQLModel):
    first_name: str
    last_name: str
    email: str


class User(UserBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)
    password_hash: str

    connections: list["Connection"] = Relationship(back_populates="user")
    created_counterparties: list["Counterparty"] = Relationship(
        back_populates="creator"
    )


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str

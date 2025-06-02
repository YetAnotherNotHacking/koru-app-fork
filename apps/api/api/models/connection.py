from typing import TYPE_CHECKING

from nanoid import generate
from sqlmodel import Field, Relationship, SQLModel

from api.schemas.connection import ConnectionType

from .base import BaseModel

if TYPE_CHECKING:
    from .account import Account
    from .user import User


class ConnectionBase(SQLModel):
    user_id: str = Field(foreign_key="user.id")
    connection_type: ConnectionType
    internal_id: str | None = None
    institution_id: str | None = None


class Connection(ConnectionBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)

    accounts: list["Account"] = Relationship(back_populates="connection")
    user: "User" = Relationship(back_populates="connections")


class ConnectionCreate(ConnectionBase):
    pass


class ConnectionRead(ConnectionBase):
    id: str

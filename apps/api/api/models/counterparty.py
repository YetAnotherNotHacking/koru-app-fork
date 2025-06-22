from typing import TYPE_CHECKING

from nanoid import generate
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel

if TYPE_CHECKING:
    from .transaction import Transaction
    from .user import User


class CounterpartyBase(SQLModel):
    creator_id: str = Field(foreign_key="user.id", index=True)
    name: str
    notes: str | None = None
    iban: str | None = Field(default=None, index=True)
    bban: str | None = Field(default=None, index=True)


class Counterparty(CounterpartyBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)
    creator: "User" = Relationship(back_populates="created_counterparties")
    transactions: list["Transaction"] = Relationship(
        back_populates="opposing_counterparty"
    )


class CounterpartyCreate(CounterpartyBase):
    pass


class CounterpartyRead(CounterpartyBase):
    id: str

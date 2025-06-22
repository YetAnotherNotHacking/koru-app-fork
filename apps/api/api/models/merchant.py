from typing import TYPE_CHECKING

from nanoid import generate
from sqlmodel import Field, Relationship, SQLModel

from .base import BaseModel

if TYPE_CHECKING:
    from .transaction import Transaction


class MerchantBase(SQLModel):
    name: str
    category: str
    match_prefix: str = Field(index=True)
    logo_url: str | None = None
    url: str | None = None


class Merchant(MerchantBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)
    transactions: list["Transaction"] = Relationship(back_populates="opposing_merchant")


class MerchantCreate(MerchantBase):
    pass


class MerchantRead(MerchantBase):
    id: str

from typing import TYPE_CHECKING

from nanoid import generate
from sqlmodel import Field, Relationship, SQLModel

from api.schemas.account import AccountType, ISOAccountType, UsageType

from .base import BaseModel

if TYPE_CHECKING:
    from .transaction import Transaction
    from .user import User


class AccountBase(SQLModel):
    user_id: str = Field(default=None, foreign_key="user.id")
    name: str = Field(default=None, unique=True)
    notes: str | None = None
    currency: str
    account_type: AccountType

    # Account identifiers (only relevant for bank accounts)
    iban: str | None
    bban: str | None
    bic: str | None = None
    scan_code: str | None = None
    internal_id: str | None = None

    # Account metadata (only relevant for bank accounts)
    owner_name: str | None = None
    usage_type: UsageType | None = None
    iso_account_type: ISOAccountType | None = None


class Account(AccountBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)

    user: "User" = Relationship(back_populates="accounts")
    transactions: list["Transaction"] = Relationship(back_populates="account")
    opposing_transactions: list["Transaction"] = Relationship(
        back_populates="opposing_account"
    )


class AccountCreate(AccountBase):
    pass


class AccountRead(AccountBase):
    id: str

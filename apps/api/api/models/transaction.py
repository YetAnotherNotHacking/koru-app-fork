from datetime import datetime
from typing import TYPE_CHECKING, Optional

from nanoid import generate
from sqlmodel import Field, Index, Relationship, SQLModel, text

from api.models.enums.transaction import ProcessingStatus

from .base import BaseModel

if TYPE_CHECKING:
    from .account import Account
    from .counterparty import Counterparty
    from .merchant import Merchant


class TransactionBase(SQLModel):
    account_id: str = Field(foreign_key="account.id", index=True)
    amount: float
    currency: str
    native_amount: float
    processing_status: ProcessingStatus = Field(
        default=ProcessingStatus.UNPROCESSED, index=True
    )

    # Counterparty
    opposing_name: str | None = None
    opposing_iban: str | None = None
    opposing_bban: str | None = None

    opposing_merchant_id: str | None = Field(default=None, foreign_key="merchant.id")
    opposing_counterparty_id: str | None = Field(
        default=None, foreign_key="counterparty.id"
    )
    opposing_account_id: str | None = Field(default=None, foreign_key="account.id")

    # Transaction identifiers
    gocardless_id: str | None = None
    internal_id: str | None = None

    # Transaction metadata
    booking_time: datetime = Field(index=True)
    value_time: datetime | None = None

    __table_args__ = (
        Index(
            "ix_transaction_unique_identifiers",
            text("coalesce(gocardless_id, '')"),
            text("coalesce(internal_id, '')"),
            unique=True,
        ),
        Index(
            "ix_transaction_account_processing_status",
            "account_id",
            "processing_status",
        ),
    )


class Transaction(TransactionBase, BaseModel, table=True):
    id: str = Field(default_factory=generate, primary_key=True)

    account: "Account" = Relationship(
        back_populates="transactions",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.account_id]"},
    )
    opposing_merchant: Optional["Merchant"] = Relationship(
        back_populates="transactions"
    )
    opposing_counterparty: Optional["Counterparty"] = Relationship(
        back_populates="transactions",
    )
    opposing_account: Optional["Account"] = Relationship(
        back_populates="opposing_transactions",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.opposing_account_id]"},
    )


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: str


class TransactionReadRelations(TransactionRead):
    account: "Account"
    opposing_merchant: Optional["Merchant"]
    opposing_counterparty: Optional["Counterparty"]
    opposing_account: Optional["Account"]

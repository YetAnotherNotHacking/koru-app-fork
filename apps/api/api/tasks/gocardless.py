from datetime import datetime

from celery import group
from sqlalchemy import text
from sqlmodel import Session, col, select

from api.core.celery import app
from api.core.exceptions import (
    ConnectionMissingDataError,
    ConnectionNotFoundError,
    TransactionMissingDataError,
)
from api.core.gocardless import (
    get_account_details,
    get_requisition,
    get_transactions,
)
from api.db.database import engine
from api.db.utils import upsert_db
from api.models.account import Account, AccountType, ISOAccountType
from api.models.connection import Connection
from api.models.transaction import ProcessingStatus, Transaction

account_index_elements = ["internal_id"]
account_columns = Account.model_fields.keys()
account_exclude_columns = {
    "id",
    "created_at",
    "updated_at",  # We handle this manually with text("now()")
    "connection_id",
    "internal_id",
    # User managed columns
    "notes",
    "balance_offset",
}
account_update_columns = [
    col for col in account_columns if col not in account_exclude_columns
]

transaction_index_elements = [
    text("coalesce(gocardless_id, '')"),
    text("coalesce(internal_id, '')"),
]
transaction_columns = Transaction.model_fields.keys()
transaction_exclude_columns = {
    "id",
    "created_at",
    "updated_at",  # We handle this manually with text("now()")
    "account_id",
    "opposing_counterparty_id",  # Reset on change
    "opposing_account_id",  # Reset on change
    "gocardless_id",
    "internal_id",
    "processing_status",  # Reset to UNPROCESSED on change
}
transaction_update_columns = [
    col for col in transaction_columns if col not in transaction_exclude_columns
]


@app.task
def import_account(account_id: str, connection_id: str) -> None:
    with Session(engine) as session:
        details = get_account_details(account_id)
        transactions = get_transactions(account_id)

        db_account = Account(
            connection_id=connection_id,
            name=details.displayName or details.name or "Imported Account",
            currency=details.currency,
            account_type=AccountType.BANK_GOCARDLESS,
            balance_offset=0.0,
            iban=details.iban,
            bban=details.bban,
            bic=details.bic,
            scan_code=details.scan,
            internal_id=account_id,
            owner_name=details.ownerName,
            usage_type=details.usage,
            iso_account_type=ISOAccountType(details.cashAccountType),
        )

        upsert_db(
            [db_account.model_dump()],
            session,
            model=Account,
            update_whitelist=account_update_columns,
            index_elements=account_index_elements,
            update_override={"updated_at": text("now()")},
        )

        account_mapping = {
            account.internal_id: account.id
            for account in session.exec(
                select(Account).where(
                    Account.connection_id == connection_id,
                    col(Account.internal_id).isnot(None),
                )
            )
        }

        transactions_to_upsert = []

        for transaction in transactions.booked:
            opposing_account = (
                transaction.creditorAccount
                if transaction.transactionAmount.amount < 0
                else transaction.debitorAccount
            )

            opposing_name = (
                transaction.creditorName
                if transaction.transactionAmount.amount < 0
                else transaction.debitorName
            )

            opposing_iban = opposing_account.iban if opposing_account else None
            opposing_bban = opposing_account.bban if opposing_account else None

            booking_time_str = transaction.bookingDateTime or transaction.bookingDate
            value_time_str = transaction.valueDateTime or transaction.valueDate

            if not booking_time_str:
                raise TransactionMissingDataError(
                    transaction.transactionId, "booking date"
                )

            if not value_time_str:
                raise TransactionMissingDataError(
                    transaction.transactionId, "value date"
                )

            value_time = datetime.fromisoformat(value_time_str)
            booking_time = datetime.fromisoformat(booking_time_str)

            db_transaction = Transaction(
                account_id=account_mapping[account_id],
                amount=transaction.transactionAmount.amount,
                currency=transaction.transactionAmount.currency,
                native_amount=transaction.transactionAmount.amount,
                processing_status=ProcessingStatus.UNPROCESSED,
                opposing_name=opposing_name,
                opposing_iban=opposing_iban,
                opposing_bban=opposing_bban,
                gocardless_id=transaction.internalTransactionId,
                internal_id=transaction.transactionId,
                booking_time=booking_time,
                value_time=value_time,
            )

            transactions_to_upsert.append(db_transaction.model_dump())

        upsert_db(
            transactions_to_upsert,
            session,
            model=Transaction,
            update_whitelist=transaction_update_columns,
            index_elements=transaction_index_elements,
            update_override={
                "updated_at": text("now()"),
                "processing_status": ProcessingStatus.UNPROCESSED.value,
                "opposing_counterparty_id": None,
                "opposing_account_id": None,
            },
        )


@app.task
def import_requisition(connection_id: str) -> str:
    with Session(engine) as session:
        connection = session.exec(
            select(Connection).where(Connection.id == connection_id)
        ).first()

        if not connection:
            raise ConnectionNotFoundError(connection_id)

        if not connection.internal_id:
            raise ConnectionMissingDataError(connection_id, "internal ID")

        account_ids = get_requisition(connection.internal_id).accounts

        account_tasks = group(
            import_account.s(account_id, connection_id) for account_id in account_ids
        )

        result = account_tasks.apply_async()

        # celery-types doesn't properly type this, this should be a GroupResult
        # not an AsyncResult, but that is also not properly typed
        result.save()  # type: ignore[attr-defined]

        return result.id

from datetime import datetime

from sqlalchemy import text, tuple_
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session, col, select

from api.core.celery import app
from api.core.gocardless import (
    TransactionsContainer,
    get_account_details,
    get_accounts,
    get_transactions,
)
from api.db.database import engine
from api.models.account import Account, AccountType, ISOAccountType
from api.models.connection import Connection
from api.models.transaction import ProcessingStatus, Transaction

account_columns = Account.model_fields.keys()
account_exclude_columns = {
    "id",
    "created_at",
    "updated_at",  # We handle this manually with text("now()")
    "connection_id",
    "iban",
    "bban",
    "bic",
    "scan_code",
}
account_update_columns = [
    col for col in account_columns if col not in account_exclude_columns
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


def import_accounts(accounts: list[dict], session: Session) -> None:
    insert_stmt = insert(Account).values(accounts)

    update_columns = {
        col: getattr(insert_stmt.excluded, col) for col in account_update_columns
    }

    update_columns["updated_at"] = text("now()")

    where_tuple_existing = tuple_(
        *[getattr(Account, col) for col in account_update_columns]
    )
    where_tuple_new = tuple_(
        *[getattr(insert_stmt.excluded, col) for col in account_update_columns]
    )

    insert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=[
            text("coalesce(iban, '')"),
            text("coalesce(bban, '')"),
            text("coalesce(bic, '')"),
            text("coalesce(scan_code, '')"),
        ],
        set_=update_columns,
        where=where_tuple_existing.is_distinct_from(where_tuple_new),
    )

    session.execute(insert_stmt)

    session.commit()


def import_transactions(transactions: list[dict], session: Session) -> None:
    insert_stmt = insert(Transaction).values(transactions)

    update_columns = {
        col: getattr(insert_stmt.excluded, col) for col in transaction_update_columns
    }

    update_columns["updated_at"] = text("now()")
    update_columns["processing_status"] = ProcessingStatus.UNPROCESSED.value
    update_columns["opposing_counterparty_id"] = None
    update_columns["opposing_account_id"] = None

    where_tuple_existing = tuple_(
        *[getattr(Transaction, col) for col in transaction_update_columns]
    )
    where_tuple_new = tuple_(
        *[getattr(insert_stmt.excluded, col) for col in transaction_update_columns]
    )

    insert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=[
            text("coalesce(gocardless_id, '')"),
            text("coalesce(internal_id, '')"),
        ],
        set_=update_columns,
        where=where_tuple_existing.is_distinct_from(where_tuple_new),
    )

    session.execute(insert_stmt)
    session.commit()


@app.task
def import_requisition(requisition_id: str, connection_id: str) -> None:
    with Session(engine) as session:
        connection = session.exec(
            select(Connection).where(Connection.id == connection_id)
        ).first()

        if not connection:
            raise Exception(f"Connection {connection_id} not found")

        account_ids = get_accounts(requisition_id)

        accounts_to_upsert = []
        all_transactions: dict[str, TransactionsContainer] = {}

        for account_id in account_ids:
            details = get_account_details(account_id)
            all_transactions[account_id] = get_transactions(account_id)

            db_account = Account(
                connection_id=connection_id,
                name=details.displayName or details.name,
                currency=details.currency,
                account_type=AccountType.BANK_GOCARDLESS,
                iban=details.iban,
                bban=details.bban,
                bic=details.bic,
                scan_code=details.scan,
                internal_id=account_id,
                owner_name=details.ownerName,
                usage_type=details.usage,
                iso_account_type=ISOAccountType(details.cashAccountType),
            )

            accounts_to_upsert.append(db_account.model_dump())

        import_accounts(accounts_to_upsert, session)

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
        for account_id, transactions in all_transactions.items():
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

                booking_time_str = (
                    transaction.bookingDateTime or transaction.bookingDate
                )
                value_time_str = transaction.valueDateTime or transaction.valueDate

                if not booking_time_str:
                    raise Exception(
                        f"Transaction {transaction.transactionId} has no booking date"
                    )

                if not value_time_str:
                    raise Exception(
                        f"Transaction {transaction.transactionId} has no value date"
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

        import_transactions(transactions_to_upsert, session)

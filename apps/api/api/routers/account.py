from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import and_, case, func
from sqlmodel import Session, select

from api.db.database import get_db
from api.dependencies import get_user
from api.models.account import Account, AccountRead
from api.models.connection import Connection
from api.models.transaction import Transaction
from api.models.user import User

router = APIRouter(prefix="/account", tags=["Account"])


class AccountReadWithBalance(AccountRead):
    balance: float


@router.get("")
def get_accounts(
    user: Annotated[User, Depends(get_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AccountReadWithBalance]:
    # Query to get accounts with calculated balance
    query = (
        select(  # type: ignore[var-annotated]
            Account,
            (
                func.coalesce(func.sum(Transaction.amount), 0) + Account.balance_offset
            ).label("balance"),
        )
        .join(Connection)
        .outerjoin(Transaction)
        .where(Connection.user_id == user.id)
        .group_by(Account.id)
    )

    results = db.exec(query).all()

    # Convert results to AccountReadWithBalance objects
    accounts = []
    for account, balance in results:
        accounts.append(
            AccountReadWithBalance.model_validate(account, update={"balance": balance})
        )

    return accounts


class AccountStatistics(BaseModel):
    last_30d_income: float
    last_30d_expense: float


@router.get("/statistics")
def get_account_statistics(
    user: Annotated[User, Depends(get_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AccountStatistics:
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)

    query = (
        select(
            func.coalesce(
                func.sum(case((Transaction.amount > 0, Transaction.amount), else_=0)),  # type: ignore[arg-type]
                0,
            ).label("last_30d_income"),
            func.coalesce(
                func.sum(case((Transaction.amount < 0, -Transaction.amount), else_=0)),  # type: ignore[arg-type]
                0,
            ).label("last_30d_expense"),
        )
        .select_from(Account)
        .join(Connection)
        .outerjoin(Transaction)
        .where(
            and_(
                Connection.user_id == user.id,  # type: ignore[arg-type]
                Transaction.booking_time >= thirty_days_ago,  # type: ignore[arg-type]
                Transaction.booking_time < now,  # type: ignore[arg-type]
            )
        )
    )

    result = db.exec(query).first()

    return AccountStatistics(
        last_30d_income=result[0] if result else 0.0,
        last_30d_expense=result[1] if result else 0.0,
    )

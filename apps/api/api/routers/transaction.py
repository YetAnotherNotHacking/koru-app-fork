from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session, col, select

from api.db.database import get_db
from api.dependencies import get_user
from api.models.connection import Connection
from api.models.transaction import Transaction, TransactionReadWithOpposing
from api.models.user import User

router = APIRouter(prefix="/transaction", tags=["Transaction"])


@router.get("")
def get_transactions(
    user: Annotated[User, Depends(get_user)],
    db: Annotated[Session, Depends(get_db)],
    offset: int = 0,
    limit: int = 100,
) -> list[TransactionReadWithOpposing]:
    transactions = db.exec(
        select(Transaction)
        # mypy complains about the arg type, but it's correct
        .join(Transaction.account)  # type: ignore[arg-type]
        .join(Connection)
        .where(Connection.user_id == user.id)
        .order_by(col(Transaction.booking_time).desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return [TransactionReadWithOpposing.model_validate(t) for t in transactions]

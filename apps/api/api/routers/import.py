from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from api.db.database import get_db
from api.dependencies import get_user
from api.models.connection import Connection
from api.models.user import User
from api.schemas.base import MessageResponse
from api.tasks.gocardless import import_requisition

router = APIRouter(prefix="/import", tags=["Transaction Importing"])


@router.post("/gocardless/{connection_id}")
def import_gocardless(
    connection_id: str,
    user: Annotated[User, Depends(get_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    connection = db.exec(
        select(Connection).where(Connection.id == connection_id)
    ).first()

    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    import_requisition.delay(connection_id)
    return MessageResponse(message="Importing transactions from GoCardless")

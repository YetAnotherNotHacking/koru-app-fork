from enum import Enum
from typing import Annotated, cast

from celery.result import GroupResult
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from api.core.celery import app
from api.db.database import get_db
from api.dependencies import get_user
from api.models.connection import Connection
from api.models.user import User
from api.schemas.base import ErrorResponse
from api.tasks.gocardless import import_requisition

router = APIRouter(prefix="/import", tags=["Transaction Importing"])


class ImportRequisitionResponse(BaseModel):
    task_id: str


@router.post("/gocardless/{connection_id}")
def import_gocardless(
    connection_id: str,
    user: Annotated[User, Depends(get_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ImportRequisitionResponse:
    connection = db.exec(
        select(Connection).where(Connection.id == connection_id)
    ).first()

    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")

    if connection.user_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    task_id = import_requisition.delay(connection_id).get(timeout=5)
    return ImportRequisitionResponse(task_id=task_id)


class TaskStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILURE = "failure"


class TaskStatusResponse(BaseModel):
    ready: bool
    status: TaskStatus
    completed_count: int
    total_count: int


@router.get(
    "/task/{task_id}", responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}}
)
def get_task_status(
    task_id: str,
    _: Annotated[User, Depends(get_user)],
) -> TaskStatusResponse:
    # TODO: currently this can be called by anyone, but the information is not
    # that sensitive, and you need a task id.

    # celery-types doesn't properly type this either, but it's the best we can do
    task = cast(GroupResult | None, GroupResult.restore(task_id, app=app))  # type: ignore[attr-defined]

    if not task:
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found",
        )

    completed_count = cast(int, task.completed_count())  # type: ignore[attr-defined]
    total_count = cast(int, len(task.results))  # type: ignore[attr-defined]
    ready = cast(bool, task.ready())  # type: ignore[attr-defined]
    successful = cast(bool, task.successful())  # type: ignore[attr-defined]
    status = (
        TaskStatus.SUCCESS
        if successful
        else (TaskStatus.FAILURE if ready else TaskStatus.PENDING)
    )

    return TaskStatusResponse(
        ready=ready,
        status=status,
        completed_count=completed_count,
        total_count=total_count,
    )

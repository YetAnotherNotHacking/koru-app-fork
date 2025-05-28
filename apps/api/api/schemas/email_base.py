from typing import Generic, TypeVar

from pydantic import BaseModel


class BaseEmailPayload(BaseModel):
    pass


PayloadType = TypeVar("PayloadType", bound=BaseEmailPayload)


class BaseEmail(BaseModel, Generic[PayloadType]):
    type: str
    to: str
    subject: str
    payload: PayloadType

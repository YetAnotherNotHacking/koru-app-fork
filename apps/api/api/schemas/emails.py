from typing import Literal

from .email_base import BaseEmail, BaseEmailPayload


class ConfirmEmailPayload(BaseEmailPayload):
    name: str | None = None
    type: Literal["signup", "waitlist"]
    confirmationLink: str
    expirationHours: int = 24


class ConfirmEmail(BaseEmail[ConfirmEmailPayload]):
    type: Literal["confirm-email"] = "confirm-email"

from typing import Literal

from .email_base import BaseEmail, BaseEmailPayload


class WelcomeEmailPayload(BaseEmailPayload):
    username: str
    verificationLink: str


class WelcomeEmail(BaseEmail[WelcomeEmailPayload]):
    type: Literal["welcome-email"] = "welcome-email"


class MyEmailPayload(BaseEmailPayload):
    name: str
    email: str
    message: str


class MyEmail(BaseEmail[MyEmailPayload]):
    type: Literal["my-email"] = "my-email"

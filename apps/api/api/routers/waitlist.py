import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from api.core.config import settings
from api.core.rabbitmq import RabbitMQConnection, get_rabbitmq
from api.core.redis import blacklist_token, is_token_blacklisted
from api.core.security import create_token, decode_jwt
from api.schemas.base import MessageResponse
from api.schemas.emails import ConfirmEmail, ConfirmEmailPayload

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.post("/join")
async def join_waitlist(
    email: str,
    rmq: Annotated[RabbitMQConnection, Depends(get_rabbitmq)],
) -> MessageResponse:
    waitlist_token = create_token(email, "waitlist")

    payload = ConfirmEmailPayload(
        type="waitlist",
        confirmationLink=f"{settings.APP_URL}/api/waitlist/confirm/{waitlist_token.token}",
        expirationHours=24,
    )

    email_payload = ConfirmEmail(
        to=email,
        subject="Confirm your email address for the Koru waitlist",
        payload=payload,
    )

    rmq.publish_message(email_payload.model_dump_json(), "koru.email.dx", "email.send")

    return MessageResponse(message="Waitlist email sent")


@router.get("/confirm/{waitlist_token}")
async def confirm_waitlist(
    waitlist_token: str,
    rmq: Annotated[RabbitMQConnection, Depends(get_rabbitmq)],
) -> RedirectResponse:
    token_payload = decode_jwt(waitlist_token)

    if token_payload is None:
        raise HTTPException(status_code=401, detail="Invalid waitlist token")

    if token_payload.typ != "waitlist":
        raise HTTPException(status_code=401, detail="Invalid waitlist token")

    if is_token_blacklisted(token_payload.jti):
        raise HTTPException(status_code=401, detail="Waitlist token has been used")

    blacklist_token(token_payload.jti, settings.WAITLIST_TOKEN_EXPIRATION)

    payload = {"email": token_payload.sub}

    rmq.publish_message(json.dumps(payload), "koru.email.dx", "email.waitlist.add")

    return RedirectResponse(url="/waitlist/confirmed")

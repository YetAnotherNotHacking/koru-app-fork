from typing import Annotated

import requests
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlmodel import Session, select

from api.core.config import settings
from api.core.redis import is_token_blacklisted
from api.core.security import decode_jwt
from api.db.database import get_db
from api.models.user import User


async def get_user(
    access_token: Annotated[str, Cookie()],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    payload = decode_jwt(access_token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.typ != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type, expected access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if is_token_blacklisted(payload.jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.exec(select(User).where(User.id == payload.sub)).one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def verify_hcaptcha(hcaptcha_token: Annotated[str, Header()]) -> bool:
    response = requests.post(
        "https://hcaptcha.com/siteverify",
        data={
            "secret": settings.HCAPTCHA_SECRET,
            "response": hcaptcha_token,
        },
    )

    if not response.json()["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid hCaptcha token",
        )

    return True

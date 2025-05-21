from typing import Annotated

import requests
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from api.core.config import settings
from api.core.redis import is_token_blacklisted
from api.core.security import TokenPayload, decode_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/password")


async def decode_token(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> TokenPayload:
    payload = decode_jwt(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.type != "access":
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

    return payload


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

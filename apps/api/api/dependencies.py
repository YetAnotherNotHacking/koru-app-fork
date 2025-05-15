from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

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

    return payload

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from api.core.config import settings
from api.core.security import (
    create_access_token,
    create_refresh_token,
    decode_jwt,
)
from api.schemas.auth import Token
from api.schemas.base import ErrorResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login/password")
async def password_login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
) -> Token:
    # TODO: do the actual login flow, verify the user and password

    access_token = create_access_token(form_data.username)
    refresh_token = create_refresh_token(form_data.username)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRATION,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRATION,
    )

    return Token(
        access_token=access_token,
    )


@router.post(
    "/refresh", responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}}
)
async def refresh_token(
    refresh_token: Annotated[str, Cookie()],
) -> Token:
    payload = decode_jwt(refresh_token)

    if payload is None or payload.type != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return Token(
        access_token=create_access_token(payload.sub),
    )


@router.post("/logout")
async def logout(response: Response) -> MessageResponse:
    # TODO: invalidate the refresh token
    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")
    return MessageResponse(message="Logged out successfully")

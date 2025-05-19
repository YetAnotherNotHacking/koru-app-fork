from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from api.core.config import settings
from api.core.redis import blacklist_token, is_token_blacklisted
from api.core.security import (
    create_access_token,
    create_refresh_token,
    decode_jwt,
    get_password_hash,
    verify_password,
)
from api.db.database import get_db
from api.models.user import User, UserCreate
from api.schemas.auth import Token
from api.schemas.base import ErrorResponse, MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login/password",
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
)
async def password_login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    user = db.exec(select(User).where(User.email == form_data.username)).one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

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
    "/register",
    responses={status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse}},
)
async def register(
    user: UserCreate,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    user_exists = db.exec(select(User).where(User.email == user.email)).one_or_none()

    if user_exists:
        raise HTTPException(status_code=400, detail="Email already in use")

    db_user = User.model_validate(
        user, update={"password_hash": get_password_hash(user.password)}
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(db_user.id)
    refresh_token = create_refresh_token(db_user.id)

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
    response: Response,
) -> Token:
    payload = decode_jwt(refresh_token)

    if payload is None or payload.type != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if is_token_blacklisted(payload.jti):
        raise HTTPException(status_code=401, detail="Refresh token has been revoked")

    access_token = create_access_token(payload.sub)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRATION,
    )

    return Token(
        access_token=access_token,
    )


@router.post("/logout")
async def logout(
    response: Response,
    access_token: Annotated[str | None, Cookie()] = None,
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> MessageResponse:
    if access_token:
        access_payload = decode_jwt(access_token)
        if access_payload:
            blacklist_token(access_payload.jti, settings.ACCESS_TOKEN_EXPIRATION)

    if refresh_token:
        refresh_payload = decode_jwt(refresh_token)
        if refresh_payload:
            blacklist_token(refresh_payload.jti, settings.REFRESH_TOKEN_EXPIRATION)

    # Clear the cookies
    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")

    return MessageResponse(message="Logged out successfully")

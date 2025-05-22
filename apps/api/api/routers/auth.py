from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from api.core.config import settings
from api.core.rabbitmq import get_rabbitmq_connection
from api.core.redis import (
    blacklist_token,
    is_email_pending,
    is_token_blacklisted,
    pop_temp_user,
    store_temp_user,
)
from api.core.security import (
    create_token,
    decode_jwt,
    get_password_hash,
    verify_password,
)
from api.db.database import get_db
from api.dependencies import verify_hcaptcha
from api.models.user import User, UserCreate
from api.schemas.auth import Token
from api.schemas.base import ErrorResponse, MessageResponse
from api.schemas.emails import ConfirmEmail, ConfirmEmailPayload

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login/password",
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
)
async def password_login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[bool, Depends(verify_hcaptcha)],
) -> Token:
    user = db.exec(select(User).where(User.email == form_data.username)).one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token, _jti = create_token(user.id, "access")
    refresh_token, _jti = create_token(user.id, "refresh")

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
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[bool, Depends(verify_hcaptcha)],
) -> MessageResponse:
    user_exists = db.exec(select(User).where(User.email == user.email)).one_or_none()
    email_pending = is_email_pending(user.email)

    if user_exists or email_pending:
        raise HTTPException(status_code=400, detail="Email already in use")

    db_user = User.model_validate(
        user, update={"password_hash": get_password_hash(user.password)}
    )

    email_token, jti = create_token(db_user.id, "email")

    payload = ConfirmEmailPayload(
        name=db_user.first_name.split(" ")[0],
        confirmationLink=f"{settings.APP_URL}/api/auth/confirm-email/{email_token}",
        expirationHours=24,
    )

    email = ConfirmEmail(
        to=user.email,
        subject="Confirm your email address - Koru App",
        payload=payload,
    )

    store_temp_user(db_user, jti, user.email)

    rmq_conn = get_rabbitmq_connection()
    rmq_conn.publish_message(email.model_dump_json(), "koru.email.dx", "email.send")

    return MessageResponse(message="Verification email sent")


@router.get("/confirm-email/{email_token}")
async def confirm_email(
    email_token: str,
    db: Annotated[Session, Depends(get_db)],
) -> RedirectResponse:
    payload = decode_jwt(email_token)

    if payload is None or payload.type != "email":
        raise HTTPException(status_code=400, detail="Invalid email token")

    user = pop_temp_user(payload.jti)

    print(user)

    if user is None:
        raise HTTPException(status_code=400, detail="Invalid email token")

    db.add(user)
    db.commit()

    access_token, _jti = create_token(user.id, "access")
    refresh_token, _jti = create_token(user.id, "refresh")

    response = RedirectResponse(
        url=f"{settings.APP_URL}/auth/login",
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRATION,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRATION,
    )

    return response


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

    access_token, _jti = create_token(payload.sub, "access")

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

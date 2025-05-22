from datetime import UTC, datetime, timedelta
from typing import Literal

import jwt  # PyJWT
from nanoid import generate
from passlib.context import CryptContext
from pydantic import BaseModel, ValidationError

from api.core.config import settings

# ---- JWT ----


class TokenPayload(BaseModel):
    sub: str  # Subject (user ID)
    type: str = "access"  # "access" or "refresh"
    exp: datetime
    iat: datetime
    jti: str  # JWT ID, used for token revocation/blacklisting


TOKEN_TYPES = Literal["access"] | Literal["refresh"] | Literal["email"]

EXPIRY_TIMES: dict[TOKEN_TYPES, int] = {
    "access": settings.ACCESS_TOKEN_EXPIRATION,
    "refresh": settings.REFRESH_TOKEN_EXPIRATION,
    "email": settings.EMAIL_TOKEN_EXPIRATION,
}


def create_jwt_token(
    subject: str,
    token_type: TOKEN_TYPES,
    expires_delta: timedelta,
) -> tuple[str, str]:
    expire = datetime.now(UTC) + expires_delta
    jti = generate()
    to_encode = TokenPayload(
        sub=subject,
        type=token_type,
        exp=expire,
        iat=datetime.now(UTC),
        jti=jti,
    )
    encoded_jwt = jwt.encode(
        to_encode.model_dump(),
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt, jti


def create_token(subject: str, token_type: TOKEN_TYPES) -> tuple[str, str]:
    expires_delta = timedelta(seconds=EXPIRY_TIMES[token_type])
    return create_jwt_token(
        subject=subject, token_type=token_type, expires_delta=expires_delta
    )


def decode_jwt(token: str) -> TokenPayload | None:
    try:
        payload_dict = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return TokenPayload(**payload_dict)
    except (jwt.PyJWTError, ValidationError):
        return None


# ---- Password ----

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

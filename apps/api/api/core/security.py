from datetime import UTC, datetime, timedelta

import jwt  # PyJWT
from passlib.context import CryptContext
from pydantic import BaseModel, ValidationError

from api.core.config import settings

# ---- JWT ----


class TokenPayload(BaseModel):
    sub: str  # Subject (user ID)
    type: str = "access"  # "access" or "refresh"
    exp: datetime
    iat: datetime
    # jti: Optional[str] = None # JWT ID, useful for advanced refresh token strategies


def create_jwt_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    expire = datetime.now(UTC) + expires_delta
    to_encode = TokenPayload(
        sub=subject, type=token_type, exp=expire, iat=datetime.now(UTC)
    )
    encoded_jwt = jwt.encode(
        to_encode.model_dump(),
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_access_token(subject: str) -> str:
    expires_delta = timedelta(seconds=settings.ACCESS_TOKEN_EXPIRATION)
    return create_jwt_token(
        subject=subject, token_type="access", expires_delta=expires_delta
    )


def create_refresh_token(subject: str) -> str:
    expires_delta = timedelta(seconds=settings.REFRESH_TOKEN_EXPIRATION)
    return create_jwt_token(
        subject=subject, token_type="refresh", expires_delta=expires_delta
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

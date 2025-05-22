from functools import lru_cache

import redis

from api.core.config import settings
from api.core.security import EXPIRY_TIMES
from api.models.user import User


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD or None,
        decode_responses=True,
    )


redis_client = get_redis_client()


def is_token_blacklisted(token_id: str) -> bool:
    key = f"{settings.REDIS_PREFIX}blacklist:{token_id}"
    return redis_client.exists(key) == 1


def blacklist_token(token_id: str, expires_in: int) -> None:
    key = f"{settings.REDIS_PREFIX}blacklist:{token_id}"
    redis_client.set(key, "1", ex=expires_in)


def store_temp_user(user: User, jti: str, email: str) -> None:
    key = f"{settings.REDIS_PREFIX}registration:{jti}"
    redis_client.set(key, user.model_dump_json(), ex=EXPIRY_TIMES["email"])

    email_key = f"{settings.REDIS_PREFIX}registration:email:{email}"
    redis_client.set(email_key, "1", ex=EXPIRY_TIMES["email"])


def pop_temp_user(jti: str) -> User | None:
    key = f"{settings.REDIS_PREFIX}registration:{jti}"

    value = redis_client.getdel(key)

    if value is None:
        return None

    user = User.model_validate_json(value)

    email_key = f"{settings.REDIS_PREFIX}registration:email:{user.email}"
    redis_client.delete(email_key)

    return user


def is_email_pending(email: str) -> bool:
    key = f"{settings.REDIS_PREFIX}registration:email:{email}"
    return redis_client.exists(key) == 1

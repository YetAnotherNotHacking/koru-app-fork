from functools import lru_cache

import redis

from api.core.config import settings


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

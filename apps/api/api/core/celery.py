from celery import Celery
from celery.app.task import Task

from api.core.config import settings

# Monkey patch recommended by celery-types
Task.__class_getitem__ = classmethod(lambda cls, *args, **kwargs: cls)  # type: ignore[attr-defined]


redis_password_part = f":{settings.REDIS_PASSWORD}@" if settings.REDIS_PASSWORD else ""
redis_url = f"redis://{redis_password_part}{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"

app = Celery(
    __name__,
    broker=redis_url,
    backend=redis_url,
    include=["api.tasks"],
)

app.conf.result_backend_transport_options = {
    "global_keyprefix": settings.REDIS_PREFIX + "celery:"
}

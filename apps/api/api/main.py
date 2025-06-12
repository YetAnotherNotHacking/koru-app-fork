from typing import Annotated

from fastapi import Depends, FastAPI, status
from fastapi.routing import APIRoute

from api.core.config import settings
from api.models.user import User
from api.schemas.base import ErrorResponse, MessageResponse
from api.tasks.gocardless import import_requisition
from api.tasks.test import test_task

from .dependencies import get_user
from .middleware.cloudflare_ip import CloudflareMiddleware
from .routers import auth, waitlist


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.operation_id:
        return route.operation_id

    name_parts = route.name.split("_")
    return name_parts[0] + "".join(part.capitalize() for part in name_parts[1:])


app = FastAPI(
    generate_unique_id_function=custom_generate_unique_id,
    root_path="/api",
)

app.add_middleware(CloudflareMiddleware)

app.include_router(auth.router)
app.include_router(waitlist.router)


@app.get("/")
async def root() -> MessageResponse:
    import_requisition.delay("BhfBoZgAFxqMd3agt8wh2")
    return MessageResponse(message="Hello from FastAPI Backend (root of app object)!")


@app.get("/hello")
async def hello_world() -> MessageResponse:
    return MessageResponse(message="API says: Hello World, from Python!")


@app.get(
    "/ping",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Authentication failed.",
            "model": ErrorResponse,
        }
    },
)
async def ping(
    user: Annotated[User, Depends(get_user)],
) -> MessageResponse:
    res = test_task.delay()
    return MessageResponse(
        message=f"API says: Hi {user.first_name}! {res.get(timeout=10)}"
    )


@app.get("/hcaptcha/sitekey")
async def get_hcaptcha_sitekey() -> MessageResponse:
    return MessageResponse(message=settings.HCAPTCHA_SITEKEY)

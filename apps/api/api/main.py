from typing import Annotated

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from pydantic import BaseModel

from api.core.config import settings
from api.core.security import TokenPayload
from api.schemas.base import ErrorResponse, MessageResponse
from api.tasks.test import test_task

from .dependencies import decode_token
from .routers import auth


def custom_generate_unique_id(route: APIRoute) -> str:
    if route.operation_id:
        return route.operation_id

    name_parts = route.name.split("_")
    return name_parts[0] + "".join(part.capitalize() for part in name_parts[1:])


app = FastAPI(
    generate_unique_id_function=custom_generate_unique_id,
    root_path="/api",
)

app.include_router(auth.router)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",  # Next.js default dev port
    "http://localhost:8081",  # Expo web default dev port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class User(BaseModel):
    name: str
    email: str


@app.get("/")
async def root() -> MessageResponse:
    # This endpoint is less relevant when running via Uvicorn directly on main:app
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
    _: Annotated[TokenPayload, Depends(decode_token)],
) -> MessageResponse:
    res = test_task.delay()
    return MessageResponse(message=f"API says: Pong! {res.get(timeout=10)}")


@app.post(
    "/users",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Authentication failed.",
            "model": ErrorResponse,
        }
    },
)
async def create_user(
    user: User,
    token_payload: Annotated[TokenPayload, Depends(decode_token)],
) -> MessageResponse:
    return MessageResponse(message="User created successfully!")


@app.get("/hcaptcha/sitekey")
async def get_hcaptcha_sitekey() -> MessageResponse:
    return MessageResponse(message=settings.HCAPTCHA_SITEKEY)

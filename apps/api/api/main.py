from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/password")

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


class MessageResponse(BaseModel):
    message: str


@app.get("/")
async def root() -> MessageResponse:
    # This endpoint is less relevant when running via Uvicorn directly on main:app
    return MessageResponse(message="Hello from FastAPI Backend (root of app object)!")


@app.get("/hello")
async def hello_world() -> MessageResponse:
    return MessageResponse(message="API says: Hello World, from Python!")


@app.get("/ping")
async def ping() -> MessageResponse:
    return MessageResponse(message="API says: Pong!")


@app.post("/users")
async def create_user(
    user: User,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> MessageResponse:
    print(f"Token: {token}")
    print(f"User: {user}")
    return MessageResponse(message="User created successfully!")

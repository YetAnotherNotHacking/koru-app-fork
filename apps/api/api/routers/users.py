from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Create a router for user-related endpoints
router = APIRouter(
    prefix="/users",  # All routes will be prefixed with /users
    tags=["users"],  # This groups endpoints in the OpenAPI docs
)


# Pydantic models for request/response data
class User(BaseModel):
    id: int
    name: str
    email: str
    age: int | None = None


class UserCreate(BaseModel):
    name: str
    email: str
    age: int | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    age: int | None = None


# In-memory storage for demo (in real apps, you'd use a database)
users_db: list[User] = [
    User(id=1, name="Alice", email="alice@example.com", age=25),
    User(id=2, name="Bob", email="bob@example.com", age=30),
]
next_id = 3


@router.get("/", response_model=list[User])
async def get_all_users():
    """Get all users"""
    return users_db


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    """Get a specific user by ID"""
    user = next((user for user in users_db if user.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    global next_id

    # Check if email already exists
    if any(user.email == user_data.email for user in users_db):
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        id=next_id, name=user_data.name, email=user_data.email, age=user_data.age
    )
    users_db.append(new_user)
    next_id += 1
    return new_user


@router.put("/{user_id}", response_model=User)
async def update_user(user_id: int, user_data: UserUpdate):
    """Update an existing user"""
    user = next((user for user in users_db if user.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only provided fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.email is not None:
        # Check if new email is already taken by another user
        if any(u.email == user_data.email and u.id != user_id for u in users_db):
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_data.email
    if user_data.age is not None:
        user.age = user_data.age

    return user


@router.delete("/{user_id}")
async def delete_user(user_id: int):
    """Delete a user"""
    global users_db
    user_index = next(
        (i for i, user in enumerate(users_db) if user.id == user_id), None
    )
    if user_index is None:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_user = users_db.pop(user_index)
    return {"message": f"User {deleted_user.name} deleted successfully"}

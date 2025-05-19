from nanoid import generate
from sqlmodel import Field, SQLModel


class UserBase(SQLModel):
    first_name: str
    last_name: str
    email: str


class User(UserBase, table=True):
    id: str = Field(default_factory=generate, primary_key=True)
    password_hash: str = Field()


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: str

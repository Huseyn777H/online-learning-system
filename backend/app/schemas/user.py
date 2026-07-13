from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field

from app.schemas.common import CamelModel


class UserRegister(CamelModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: str = Field(pattern="^(student|teacher)$")


class UserLogin(CamelModel):
    email: EmailStr
    password: str


class UserProfileUpdate(CamelModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None


class UserOut(CamelModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime


class AuthResponse(CamelModel):
    user: UserOut
    access_token: str


class AdminUserRoleUpdate(CamelModel):
    role: str = Field(pattern="^(student|teacher|admin)$")

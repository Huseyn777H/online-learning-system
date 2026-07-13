from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class CategoryCreate(CamelModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryUpdate(CamelModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None


class CategoryOut(CamelModel):
    id: int
    name: str
    description: Optional[str] = None

from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class ModuleCreate(CamelModel):
    course_id: int
    title: str = Field(min_length=1, max_length=255)
    order_index: int = 0


class ModuleUpdate(CamelModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    order_index: Optional[int] = None

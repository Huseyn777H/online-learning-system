from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class LessonCreate(CamelModel):
    module_id: int
    title: str = Field(min_length=1, max_length=255)
    content_type: str = Field(pattern="^(video|pdf|text)$")
    content_url: Optional[str] = None
    duration: Optional[int] = Field(default=None, ge=0)

from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class NotificationOut(CamelModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationMarkRead(CamelModel):
    ids: Optional[list[int]] = Field(default=None)

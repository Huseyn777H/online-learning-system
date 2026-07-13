from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class CourseCreate(CamelModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    level: str = Field(pattern="^(beginner|intermediate|advanced)$")


class CourseUpdate(CamelModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    level: Optional[str] = Field(default=None, pattern="^(beginner|intermediate|advanced)$")
    status: Optional[str] = Field(default=None, pattern="^(draft|published|inactive)$")


class CourseOut(CamelModel):
    id: int
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    teacher_id: int
    level: str
    status: str
    created_at: datetime


class LessonOut(CamelModel):
    id: int
    module_id: int
    title: str
    content_type: str
    content_url: Optional[str] = None
    duration: Optional[int] = None


class ModuleOut(CamelModel):
    id: int
    course_id: int
    title: str
    order_index: int
    lessons: list[LessonOut] = []


class CourseDetailOut(CourseOut):
    modules: list[ModuleOut] = []


class EnrollmentOut(CamelModel):
    id: int
    user_id: int
    course_id: int
    progress: float
    enrolled_at: datetime


class EnrollmentWithCourseOut(EnrollmentOut):
    course: CourseOut

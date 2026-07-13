from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class AssignmentCreate(CamelModel):
    course_id: int
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    deadline: datetime
    max_score: int = Field(default=100, ge=1)


class AssignmentOut(CamelModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    deadline: datetime
    max_score: int


class SubmissionCreate(CamelModel):
    answer_url: str = Field(min_length=1, max_length=1024)


class SubmissionGrade(CamelModel):
    score: int = Field(ge=0)
    feedback: Optional[str] = None


class SubmissionOut(CamelModel):
    id: int
    assignment_id: int
    student_id: int
    answer_url: str
    score: Optional[int] = None
    feedback: Optional[str] = None
    is_late: bool
    submitted_at: datetime

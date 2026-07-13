from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class QuizCreate(CamelModel):
    course_id: int
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    passing_score: int = Field(ge=0)
    time_limit: Optional[int] = Field(default=None, ge=0)


class QuestionCreate(CamelModel):
    question_text: str = Field(min_length=1)
    options: list[str] = Field(min_length=2)
    correct_answer: str
    score: int = Field(default=1, ge=0)


class QuestionOut(CamelModel):
    id: int
    quiz_id: int
    question_text: str
    options: list[str]
    score: int
    correct_answer: Optional[str] = None


class QuizOut(CamelModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    passing_score: int
    time_limit: Optional[int] = None


class QuizDetailOut(QuizOut):
    questions: list[QuestionOut] = []


class QuizAnswerIn(CamelModel):
    question_id: int
    answer: str


class QuizSubmit(CamelModel):
    answers: list[QuizAnswerIn]


class QuizAttemptOut(CamelModel):
    id: int
    quiz_id: int
    student_id: int
    score: int
    submitted_at: datetime
    passed: bool

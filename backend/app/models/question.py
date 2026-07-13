from sqlalchemy import String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(500), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")

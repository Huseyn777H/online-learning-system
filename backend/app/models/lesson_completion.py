from datetime import datetime, timezone

from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_lesson_completion_user_lesson"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), nullable=False)
    enrollment_id: Mapped[int] = mapped_column(ForeignKey("enrollments.id"), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="lesson_completions")
    lesson: Mapped["Lesson"] = relationship(back_populates="completions")
    enrollment: Mapped["Enrollment"] = relationship(back_populates="lesson_completions")

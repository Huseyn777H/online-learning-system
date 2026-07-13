from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(20), nullable=False, default="text")
    content_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=True)

    module: Mapped["Module"] = relationship(back_populates="lessons")
    completions: Mapped[list["LessonCompletion"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )

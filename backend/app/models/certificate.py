from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (
        UniqueConstraint("student_id", "course_id", name="uq_certificate_student_course"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    certificate_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    certificate_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    student: Mapped["User"] = relationship(back_populates="certificates")
    course: Mapped["Course"] = relationship(back_populates="certificates")

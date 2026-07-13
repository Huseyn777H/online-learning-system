from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_completion import LessonCompletion
from app.models.module import Module


def count_total_lessons(db: Session, course_id: int) -> int:
    stmt = (
        select(func.count(Lesson.id))
        .join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == course_id)
    )
    return db.scalar(stmt) or 0


def count_completed_lessons(db: Session, enrollment_id: int) -> int:
    stmt = select(func.count(LessonCompletion.id)).where(LessonCompletion.enrollment_id == enrollment_id)
    return db.scalar(stmt) or 0


def recalculate_progress(db: Session, enrollment: Enrollment) -> Enrollment:
    """Recompute Enrollment.progress = completedLessons / totalLessons * 100 and persist it."""
    total = count_total_lessons(db, enrollment.course_id)
    completed = count_completed_lessons(db, enrollment.id)

    progress = (completed / total * 100) if total > 0 else 0.0
    enrollment.progress = round(progress, 2)

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

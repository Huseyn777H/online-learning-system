from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_completion import LessonCompletion
from app.models.module import Module
from app.models.user import User
from app.schemas.course import EnrollmentOut, LessonOut
from app.schemas.lesson import LessonCreate
from app.services.cache import invalidate_courses_cache
from app.services.progress import recalculate_progress

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.post("", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(
    payload: LessonCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> LessonOut:
    module = db.get(Module, payload.module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    course = db.get(Course, module.course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this course")

    lesson = Lesson(
        module_id=payload.module_id,
        title=payload.title,
        content_type=payload.content_type,
        content_url=payload.content_url,
        duration=payload.duration,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    invalidate_courses_cache()

    return LessonOut.model_validate(lesson)


@router.patch("/{lesson_id}/complete", response_model=EnrollmentOut)
def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> EnrollmentOut:
    lesson = db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    module = db.get(Module, lesson.module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == module.course_id)
        .first()
    )
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    existing_completion = (
        db.query(LessonCompletion)
        .filter(LessonCompletion.user_id == current_user.id, LessonCompletion.lesson_id == lesson_id)
        .first()
    )
    if existing_completion is None:
        completion = LessonCompletion(
            user_id=current_user.id,
            lesson_id=lesson_id,
            enrollment_id=enrollment.id,
        )
        db.add(completion)
        db.commit()

    enrollment = recalculate_progress(db, enrollment)
    return EnrollmentOut.model_validate(enrollment)

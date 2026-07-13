from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_db, require_role
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.course import EnrollmentWithCourseOut

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.get("", response_model=list[EnrollmentWithCourseOut])
def list_my_enrollments(
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> list[EnrollmentWithCourseOut]:
    enrollments = (
        db.query(Enrollment)
        .options(selectinload(Enrollment.course))
        .filter(Enrollment.user_id == current_user.id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    return [EnrollmentWithCourseOut.model_validate(e) for e in enrollments]

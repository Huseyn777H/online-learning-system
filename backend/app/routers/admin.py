from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.submission import Submission
from app.models.user import User
from app.schemas.admin import AdminStatsOut
from app.schemas.common import Page
from app.schemas.user import AdminUserRoleUpdate, UserOut
from app.services.cache import ADMIN_STATS_TTL, admin_stats_key, cached_or_compute, invalidate_admin_stats_cache

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsOut)
def get_admin_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> AdminStatsOut:
    def _compute() -> dict:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar() or 0
        total_teachers = db.query(func.count(User.id)).filter(User.role == "teacher").scalar() or 0
        total_courses = db.query(func.count(Course.id)).scalar() or 0
        active_enrollments = db.query(func.count(Enrollment.id)).scalar() or 0
        assignments_submitted = db.query(func.count(Submission.id)).scalar() or 0

        return {
            "totalUsers": total_users,
            "totalStudents": total_students,
            "totalTeachers": total_teachers,
            "totalCourses": total_courses,
            "activeEnrollments": active_enrollments,
            "assignmentsSubmitted": assignments_submitted,
        }

    result = cached_or_compute(admin_stats_key(), ADMIN_STATS_TTL, _compute)
    return AdminStatsOut.model_validate(result)


@router.get("/users", response_model=Page[UserOut])
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    role: str | None = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> Page[UserOut]:
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)

    total = query.with_entities(func.count(User.id)).scalar() or 0
    users = query.order_by(User.id).offset((page - 1) * page_size).limit(page_size).all()

    return Page[UserOut](
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user_role(
    user_id: int,
    payload: AdminUserRoleUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> UserOut:
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admins cannot change their own role")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = payload.role
    db.add(user)
    db.commit()
    db.refresh(user)

    invalidate_admin_stats_cache()

    return UserOut.model_validate(user)

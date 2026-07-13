from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_current_user_optional, get_db, require_role
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.common import Page
from app.schemas.course import CourseCreate, CourseDetailOut, CourseOut, CourseUpdate, EnrollmentOut
from app.services.cache import (
    cached_or_compute,
    course_list_key,
    course_search_key,
    invalidate_admin_stats_cache,
    invalidate_courses_cache,
    COURSE_LIST_TTL,
    COURSE_SEARCH_TTL,
)

router = APIRouter(prefix="/courses", tags=["courses"])


def _course_owned_or_admin(course: Course, user: User) -> bool:
    return user.role == "admin" or (user.role == "teacher" and course.teacher_id == user.id)


def _is_enrolled(db: Session, user_id: int, course_id: int) -> bool:
    stmt = select(Enrollment.id).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
    return db.scalar(stmt) is not None


@router.get("", response_model=Page[CourseOut])
def list_courses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    category_id: Optional[int] = None,
    level: Optional[str] = None,
    teacher_id: Optional[int] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> Page[CourseOut]:
    is_privileged = current_user is not None and current_user.role in ("teacher", "admin")

    cache_params = {
        "page": page,
        "pageSize": page_size,
        "categoryId": category_id,
        "level": level,
        "teacherId": teacher_id,
        "status": status_filter,
        "privileged": is_privileged,
    }

    def _compute() -> dict:
        query = db.query(Course)
        if not is_privileged:
            query = query.filter(Course.status == "published")
        elif status_filter:
            query = query.filter(Course.status == status_filter)

        if category_id is not None:
            query = query.filter(Course.category_id == category_id)
        if level is not None:
            query = query.filter(Course.level == level)
        if teacher_id is not None:
            query = query.filter(Course.teacher_id == teacher_id)

        total = query.with_entities(func.count(Course.id)).scalar() or 0
        courses = (
            query.order_by(Course.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        )
        items = [CourseOut.model_validate(c).model_dump(mode="json", by_alias=True) for c in courses]
        return {"items": items, "total": total, "page": page, "pageSize": page_size}

    key = course_list_key(cache_params)
    result = cached_or_compute(key, COURSE_LIST_TTL, _compute)
    return Page[CourseOut].model_validate(result)


@router.get("/search", response_model=Page[CourseOut])
def search_courses(
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Page[CourseOut]:
    cache_params = {
        "keyword": keyword,
        "category": category,
        "level": level,
        "page": page,
        "pageSize": page_size,
    }

    def _compute() -> dict:
        query = db.query(Course).filter(Course.status == "published")

        if keyword:
            like = f"%{keyword}%"
            query = query.filter(Course.title.ilike(like) | Course.description.ilike(like))
        if category:
            from app.models.category import Category

            query = query.join(Category, Course.category_id == Category.id).filter(Category.name.ilike(category))
        if level:
            query = query.filter(Course.level == level)

        total = query.with_entities(func.count(Course.id)).scalar() or 0
        courses = (
            query.order_by(Course.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        )
        items = [CourseOut.model_validate(c).model_dump(mode="json", by_alias=True) for c in courses]
        return {"items": items, "total": total, "page": page, "pageSize": page_size}

    key = course_search_key(cache_params)
    result = cached_or_compute(key, COURSE_SEARCH_TTL, _compute)
    return Page[CourseOut].model_validate(result)


@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> CourseOut:
    course = Course(
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        teacher_id=current_user.id,
        level=payload.level,
        status="draft",
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    invalidate_courses_cache()
    invalidate_admin_stats_cache()

    return CourseOut.model_validate(course)


@router.get("/{course_id}", response_model=CourseDetailOut)
def get_course(
    course_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> CourseDetailOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if course.status != "published":
        if current_user is None or not _course_owned_or_admin(course, current_user):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    can_see_content = False
    if current_user is not None:
        if _course_owned_or_admin(course, current_user):
            can_see_content = True
        elif current_user.role == "student" and _is_enrolled(db, current_user.id, course_id):
            can_see_content = True

    detail = CourseDetailOut.model_validate(course)
    if not can_see_content:
        for module in detail.modules:
            for lesson in module.lessons:
                lesson.content_url = None

    return detail


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not _course_owned_or_admin(course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to edit this course")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(course, field, value)

    db.add(course)
    db.commit()
    db.refresh(course)

    invalidate_courses_cache()
    invalidate_admin_stats_cache()

    return CourseOut.model_validate(course)


@router.delete("/{course_id}", response_model=CourseOut)
def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CourseOut:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not _course_owned_or_admin(course, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this course")

    course.status = "inactive"
    db.add(course)
    db.commit()
    db.refresh(course)

    invalidate_courses_cache()
    invalidate_admin_stats_cache()

    return CourseOut.model_validate(course)


@router.post("/{course_id}/enroll", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
def enroll_course(
    course_id: int,
    current_user: User = Depends(require_role("student")),
    db: Session = Depends(get_db),
) -> EnrollmentOut:
    course = db.get(Course, course_id)
    if course is None or course.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id, Enrollment.course_id == course_id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled in this course")

    enrollment = Enrollment(user_id=current_user.id, course_id=course_id, progress=0.0)
    db.add(enrollment)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already created this enrollment.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled in this course")
    db.refresh(enrollment)

    invalidate_courses_cache()
    invalidate_admin_stats_cache()

    return EnrollmentOut.model_validate(enrollment)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.course import Course
from app.models.module import Module
from app.models.user import User
from app.schemas.course import ModuleOut
from app.schemas.module import ModuleCreate, ModuleUpdate
from app.services.cache import invalidate_courses_cache

router = APIRouter(prefix="/modules", tags=["modules"])


def _assert_owns_course(db: Session, course_id: int, current_user: User) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if current_user.role != "admin" and course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this course")
    return course


@router.post("", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> ModuleOut:
    _assert_owns_course(db, payload.course_id, current_user)

    module = Module(course_id=payload.course_id, title=payload.title, order_index=payload.order_index)
    db.add(module)
    db.commit()
    db.refresh(module)

    invalidate_courses_cache()

    return ModuleOut.model_validate(module)


@router.patch("/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: int,
    payload: ModuleUpdate,
    current_user: User = Depends(require_role("teacher", "admin")),
    db: Session = Depends(get_db),
) -> ModuleOut:
    module = db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    _assert_owns_course(db, module.course_id, current_user)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(module, field, value)

    db.add(module)
    db.commit()
    db.refresh(module)

    invalidate_courses_cache()

    return ModuleOut.model_validate(module)

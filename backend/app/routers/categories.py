from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.category import Category
from app.models.course import Course
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate
from app.services.cache import invalidate_courses_cache

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    categories = db.query(Category).order_by(Category.name).all()
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> CategoryOut:
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists")

    category = Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)

    invalidate_courses_cache()

    return CategoryOut.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> CategoryOut:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(category, field, value)

    db.add(category)
    db.commit()
    db.refresh(category)

    invalidate_courses_cache()

    return CategoryOut.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    has_courses = db.query(Course.id).filter(Course.category_id == category_id).first() is not None
    if has_courses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that still has courses assigned to it",
        )

    db.delete(category)
    db.commit()

    invalidate_courses_cache()

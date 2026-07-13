from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] != current_user.email:
        existing = db.query(User).filter(User.email == updates["email"]).first()
        if existing is not None and existing.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.add(current_user)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already claimed this email.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    db.refresh(current_user)
    return UserOut.model_validate(current_user)

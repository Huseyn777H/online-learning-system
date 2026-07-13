from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationMarkRead, NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notifications]


@router.patch("/read", response_model=list[NotificationOut])
def mark_notifications_read(
    payload: NotificationMarkRead,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if payload.ids:
        query = query.filter(Notification.id.in_(payload.ids))

    notifications = query.all()
    for notification in notifications:
        notification.is_read = True
        db.add(notification)
    db.commit()

    for notification in notifications:
        db.refresh(notification)

    return [NotificationOut.model_validate(n) for n in notifications]

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse, NotificationMarkReadRequest,
    NotificationPreferenceResponse, NotificationPreferenceUpdateRequest,
)
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await notification_service.get_user_notifications(db, current_user.id, unread_only)


@router.patch("/read", status_code=200)
async def mark_read(
    data: NotificationMarkReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await notification_service.mark_notifications_read(db, current_user.id, data.notification_ids)
    return {"updated": count}


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await notification_service.get_or_create_preferences(db, current_user.id)


@router.patch("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    data: NotificationPreferenceUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs = await notification_service.get_or_create_preferences(db, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    return prefs

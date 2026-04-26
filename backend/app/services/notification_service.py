from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from app.models.notification import Notification, NotificationPreference, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: str,
    type: NotificationType,
    title: str,
    body: str,
    action_url: Optional[str] = None,
    extra_data: Optional[dict] = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        action_url=action_url,
        extra_data=extra_data,
    )
    db.add(notif)
    await db.flush()
    return notif


async def get_user_notifications(db: AsyncSession, user_id: str, unread_only: bool = False) -> List[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_notifications_read(db: AsyncSession, user_id: str, notification_ids: List[str]) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.id.in_(notification_ids))
        .values(is_read=True)
    )
    return result.rowcount


async def get_or_create_preferences(db: AsyncSession, user_id: str) -> NotificationPreference:
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        await db.flush()
    return prefs

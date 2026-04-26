from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    is_read: bool
    action_url: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkReadRequest(BaseModel):
    notification_ids: list[str]


class NotificationPreferenceResponse(BaseModel):
    id: str
    user_id: str
    email_enabled: bool
    in_app_enabled: bool
    appointment_reminders: bool
    booking_updates: bool
    missing_alerts: bool
    adoption_updates: bool

    model_config = {"from_attributes": True}


class NotificationPreferenceUpdateRequest(BaseModel):
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    appointment_reminders: Optional[bool] = None
    booking_updates: Optional[bool] = None
    missing_alerts: Optional[bool] = None
    adoption_updates: Optional[bool] = None

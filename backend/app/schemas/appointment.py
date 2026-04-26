from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional
import uuid
from app.models.appointment import AppointmentType, AppointmentStatus

class SlotCreate(BaseModel):
    date: date
    start_time: time
    end_time: time
    slot_type: AppointmentType

class SlotOut(SlotCreate):
    id: uuid.UUID
    provider_id: uuid.UUID
    is_available: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class AppointmentCreate(BaseModel):
    slot_id: Optional[uuid.UUID] = None
    pet_id: uuid.UUID
    provider_id: uuid.UUID
    appointment_type: AppointmentType
    # Direct booking: date/time/location when not using a slot
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class CancelRequest(BaseModel):
    reason: Optional[str] = None

class AppointmentOut(BaseModel):
    id: uuid.UUID
    slot_id: Optional[uuid.UUID] = None
    pet_id: uuid.UUID
    owner_id: uuid.UUID
    provider_id: uuid.UUID
    appointment_type: AppointmentType
    status: AppointmentStatus
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    pet_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

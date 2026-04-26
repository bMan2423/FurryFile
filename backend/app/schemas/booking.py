from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class BookingCreateRequest(BaseModel):
    pet_id: str
    sitter_id: str
    start_date: date
    end_date: date
    service_type: str
    price_per_day: float
    special_instructions: Optional[str] = None


class BookingUpdateRequest(BaseModel):
    status: Optional[str] = None
    special_instructions: Optional[str] = None


class BookingReviewCreateRequest(BaseModel):
    rating: int
    comment: Optional[str] = None


class BookingReviewResponse(BaseModel):
    id: str
    booking_id: str
    reviewer_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: str
    pet_id: str
    owner_id: str
    sitter_id: str
    start_date: date
    end_date: date
    service_type: str
    status: str
    price_per_day: float
    special_instructions: Optional[str] = None
    created_at: datetime
    review: Optional[BookingReviewResponse] = None

    model_config = {"from_attributes": True}

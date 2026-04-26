from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import uuid
from app.models.missing_pet import MissingStatus

class PetPhotoOut(BaseModel):
    id: uuid.UUID
    url: str
    is_primary: bool = False
    caption: Optional[str] = None
    model_config = {"from_attributes": True}

class PetSummary(BaseModel):
    id: uuid.UUID
    name: str
    species: str
    breed: Optional[str] = None
    color: Optional[str] = None
    date_of_birth: Optional[date] = None
    photos: List[PetPhotoOut] = []
    model_config = {"from_attributes": True}

class OwnerSummary(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    model_config = {"from_attributes": True}

class MissingPetCreate(BaseModel):
    pet_id: uuid.UUID
    last_seen_at: datetime
    last_seen_address: Optional[str] = None
    last_seen_lat: Optional[float] = None
    last_seen_lng: Optional[float] = None
    description: Optional[str] = None
    reward_amount: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class MissingPetUpdate(BaseModel):
    last_seen_address: Optional[str] = None
    last_seen_lat: Optional[float] = None
    last_seen_lng: Optional[float] = None
    description: Optional[str] = None
    reward_amount: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[MissingStatus] = None

class MissingPetOut(BaseModel):
    id: uuid.UUID
    pet_id: uuid.UUID
    reported_by_id: uuid.UUID
    status: MissingStatus
    last_seen_at: datetime
    last_seen_address: Optional[str] = None
    last_seen_lat: Optional[float] = None
    last_seen_lng: Optional[float] = None
    description: Optional[str] = None
    reward_amount: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Enriched joins
    pet: Optional[PetSummary] = None
    reporter: Optional[OwnerSummary] = None
    model_config = {"from_attributes": True}

class SightingCreate(BaseModel):
    sighting_lat: float
    sighting_lng: float
    sighted_at: datetime
    description: Optional[str] = None

class SightingOut(SightingCreate):
    id: uuid.UUID
    missing_pet_id: uuid.UUID
    reported_by_id: uuid.UUID
    photo_url: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

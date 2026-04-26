from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class PetPhotoResponse(BaseModel):
    id: str
    url: str
    is_primary: bool
    caption: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PetCreateRequest(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: str = "unknown"
    weight: Optional[float] = None
    color: Optional[str] = None
    microchip_id: Optional[str] = None
    is_neutered: bool = False
    notes: Optional[str] = None


class PetUpdateRequest(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    microchip_id: Optional[str] = None
    is_neutered: Optional[bool] = None
    notes: Optional[str] = None


class PetResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    species: str
    breed: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: str
    weight: Optional[float] = None
    color: Optional[str] = None
    microchip_id: Optional[str] = None
    is_neutered: bool
    is_active: bool
    notes: Optional[str] = None
    photos: List[PetPhotoResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AdoptionListingCreateRequest(BaseModel):
    pet_name: str
    species: str
    breed: Optional[str] = None
    age_years: Optional[float] = None
    gender: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    photos_urls: Optional[List[str]] = None


class AdoptionListingUpdateRequest(BaseModel):
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[str] = None
    photos_urls: Optional[List[str]] = None


class AdoptionListingResponse(BaseModel):
    id: str
    shelter_id: str
    pet_name: str
    species: str
    breed: Optional[str] = None
    age_years: Optional[float] = None
    gender: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: str
    photos_urls: Optional[str] = None  # stored as JSON string
    created_at: datetime

    model_config = {"from_attributes": True}


class AdoptionApplicationCreateRequest(BaseModel):
    listing_id: str
    message: Optional[str] = None


class AdoptionApplicationResponse(BaseModel):
    id: str
    listing_id: str
    applicant_id: str
    message: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VolunteerOpportunityResponse(BaseModel):
    id: str
    shelter_id: str
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    slots_available: int
    created_at: datetime

    model_config = {"from_attributes": True}

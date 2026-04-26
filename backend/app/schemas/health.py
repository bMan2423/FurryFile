from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class VaccinationCreateRequest(BaseModel):
    pet_id: str
    name: str
    date_given: date
    next_due: Optional[date] = None
    notes: Optional[str] = None


class VaccinationResponse(BaseModel):
    id: str
    pet_id: str
    name: str
    date_given: date
    next_due: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AllergyCreateRequest(BaseModel):
    pet_id: str
    allergen: str
    severity: str = "mild"
    notes: Optional[str] = None


class AllergyResponse(BaseModel):
    id: str
    pet_id: str
    allergen: str
    severity: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TreatmentCreateRequest(BaseModel):
    pet_id: str
    name: str
    start_date: date
    end_date: Optional[date] = None
    dosage: Optional[str] = None
    notes: Optional[str] = None


class TreatmentResponse(BaseModel):
    id: str
    pet_id: str
    name: str
    start_date: date
    end_date: Optional[date] = None
    dosage: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

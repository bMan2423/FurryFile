from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.health import Vaccination, Allergy, Treatment
from app.schemas.health import (
    VaccinationCreateRequest, VaccinationResponse,
    AllergyCreateRequest, AllergyResponse,
    TreatmentCreateRequest, TreatmentResponse,
)

router = APIRouter()


@router.get("/vaccinations", response_model=List[VaccinationResponse])
async def list_vaccinations(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vaccination).where(Vaccination.pet_id == pet_id))
    return list(result.scalars().all())


@router.post("/vaccinations", response_model=VaccinationResponse, status_code=201)
async def add_vaccination(
    data: VaccinationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vacc = Vaccination(**data.model_dump())
    db.add(vacc)
    await db.flush()
    return vacc


@router.get("/allergies", response_model=List[AllergyResponse])
async def list_allergies(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Allergy).where(Allergy.pet_id == pet_id))
    return list(result.scalars().all())


@router.post("/allergies", response_model=AllergyResponse, status_code=201)
async def add_allergy(
    data: AllergyCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allergy = Allergy(**data.model_dump())
    db.add(allergy)
    await db.flush()
    return allergy


@router.get("/treatments", response_model=List[TreatmentResponse])
async def list_treatments(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Treatment).where(Treatment.pet_id == pet_id))
    return list(result.scalars().all())


@router.post("/treatments", response_model=TreatmentResponse, status_code=201)
async def add_treatment(
    data: TreatmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    treatment = Treatment(**data.model_dump())
    db.add(treatment)
    await db.flush()
    return treatment

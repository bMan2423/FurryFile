from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import json
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.adoption import AdoptionListing, AdoptionApplication, VolunteerOpportunity, VolunteerSignup
from app.schemas.adoption import (
    AdoptionListingCreateRequest, AdoptionListingUpdateRequest, AdoptionListingResponse,
    AdoptionApplicationCreateRequest, AdoptionApplicationResponse,
    VolunteerOpportunityResponse,
)
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()


@router.get("", response_model=List[AdoptionListingResponse])
async def list_listings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AdoptionListing).order_by(AdoptionListing.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=AdoptionListingResponse, status_code=201)
async def create_listing(
    data: AdoptionListingCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing_data = data.model_dump()
    photos = listing_data.pop("photos_urls", None)
    listing = AdoptionListing(
        shelter_id=current_user.id,
        photos_urls=json.dumps(photos) if photos else None,
        **listing_data,
    )
    db.add(listing)
    await db.flush()
    return listing


@router.patch("/{listing_id}", response_model=AdoptionListingResponse)
async def update_listing(
    listing_id: str,
    data: AdoptionListingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AdoptionListing).where(AdoptionListing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise NotFoundException()
    if listing.shelter_id != current_user.id:
        raise ForbiddenException()

    update_data = data.model_dump(exclude_unset=True)
    if "photos_urls" in update_data:
        update_data["photos_urls"] = json.dumps(update_data["photos_urls"])
    for field, value in update_data.items():
        setattr(listing, field, value)
    return listing


@router.post("/applications", response_model=AdoptionApplicationResponse, status_code=201)
async def apply_for_adoption(
    data: AdoptionApplicationCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = AdoptionApplication(applicant_id=current_user.id, **data.model_dump())
    db.add(app)
    await db.flush()
    return app


@router.get("/volunteers", response_model=List[VolunteerOpportunityResponse])
async def list_volunteer_opportunities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(VolunteerOpportunity).order_by(VolunteerOpportunity.created_at.desc()))
    return list(result.scalars().all())


@router.post("/volunteers/{opportunity_id}/signup", status_code=201)
async def signup_volunteer(
    opportunity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    signup = VolunteerSignup(opportunity_id=opportunity_id, user_id=current_user.id)
    db.add(signup)
    await db.flush()
    return {"message": "Signed up successfully"}

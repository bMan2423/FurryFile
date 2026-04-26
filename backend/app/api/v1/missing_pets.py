from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime, timezone, timedelta
import uuid
from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.pet import Pet
from app.models.missing_pet import MissingPet, MissingPetPhoto, MissingPetSighting, MissingStatus
from app.models.notification import NotificationType
from app.schemas.missing_pet import MissingPetCreate, MissingPetUpdate, MissingPetOut, SightingCreate, SightingOut
from app.schemas.common import MessageResponse
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.storage import save_upload

router = APIRouter(prefix="/missing-pets", tags=["Missing Pets"])

async def _check_and_send_10day_notifications(db: AsyncSession):
    """
    For every missing (not reunited) pet, fire a broadcast notification to all
    non-vet users each time the pet crosses a new 10-day milestone.
    e.g. day 10, 20, 30 … since created_at.
    Tracks last_notified_at to avoid duplicates.
    """
    from app.services import notification_service

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(MissingPet)
        .where(MissingPet.status == MissingStatus.missing)
        .options(selectinload(MissingPet.pet).selectinload(Pet.photos))
    )
    reports = result.scalars().all()

    for report in reports:
        days_missing = (now - report.created_at.replace(tzinfo=timezone.utc)).days
        if days_missing < 10:
            continue

        # Which 10-day milestone are we at? (10, 20, 30 …)
        current_milestone = (days_missing // 10) * 10

        # Check if we already notified for this milestone
        if report.last_notified_at:
            days_since_notified = (now - report.last_notified_at.replace(tzinfo=timezone.utc)).days
            notified_milestone = current_milestone - (days_since_notified // 10) * 10
            if days_since_notified < 10:
                continue  # Already notified within this 10-day window

        pet_name = report.pet.name if report.pet else "Unknown"
        pet_species = report.pet.species if report.pet else "pet"
        title = f"🚨 Still Missing: {pet_name} ({current_milestone} days)"
        body = (
            f"{pet_name} the {pet_species} has been missing for {current_milestone} days. "
            f"Last seen: {report.last_seen_address or 'location unknown'}. "
            f"If you have any information, please help!"
        )

        # Notify all non-vet active users
        users_result = await db.execute(
            select(User).where(
                User.is_active == True,
                User.role != UserRole.veterinarian,
            )
        )
        users = users_result.scalars().all()

        for user in users:
            await notification_service.create_notification(
                db=db, user_id=user.id,
                type=NotificationType.missing_pet_alert,
                title=title, body=body,
                action_url=f"/missing/{report.id}",
                send_email=False,
            )

        # Update milestone tracker
        report.last_notified_at = now

    await db.commit()


@router.get("", response_model=List[MissingPetOut])
async def list_missing(
    status: MissingStatus = MissingStatus.missing,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MissingPet)
        .where(MissingPet.status == status)
        .options(
            selectinload(MissingPet.pet).selectinload(Pet.photos),
            selectinload(MissingPet.reporter),
        )
        .order_by(MissingPet.created_at.desc())
    )
    reports = result.scalars().all()

    # Fire 10-day notification check in background (non-blocking)
    background_tasks.add_task(_check_and_send_10day_notifications, db)

    return reports


@router.post("", response_model=MissingPetOut, status_code=201)
async def report_missing(
    data: MissingPetCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    report = MissingPet(reported_by_id=current_user.id, **data.model_dump())
    db.add(report)
    await db.commit()  # commit clears identity map so re-query uses fresh selectinload
    result = await db.execute(
        select(MissingPet).where(MissingPet.id == report.id)
        .options(selectinload(MissingPet.pet).selectinload(Pet.photos), selectinload(MissingPet.reporter))
    )
    return result.scalar_one()


@router.get("/{missing_id}", response_model=MissingPetOut)
async def get_missing(missing_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MissingPet).where(MissingPet.id == missing_id)
        .options(
            selectinload(MissingPet.photos),
            selectinload(MissingPet.sightings),
            selectinload(MissingPet.pet).selectinload(Pet.photos),
            selectinload(MissingPet.reporter),
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundException("Missing pet report not found")
    return report


@router.patch("/{missing_id}", response_model=MissingPetOut)
async def update_missing(
    missing_id: uuid.UUID,
    data: MissingPetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissingPet).where(MissingPet.id == missing_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundException("Report not found")
    if report.reported_by_id != current_user.id:
        raise ForbiddenException()
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(report, field, value)
    return report


@router.patch("/{missing_id}/found", response_model=MissingPetOut)
async def mark_found(
    missing_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissingPet).where(MissingPet.id == missing_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundException("Report not found")
    if report.reported_by_id != current_user.id:
        raise ForbiddenException()
    report.status = MissingStatus.reunited
    return report


@router.post("/{missing_id}/photos", response_model=MessageResponse, status_code=201)
async def upload_photo(
    missing_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    url = await save_upload(file, "missing")
    photo = MissingPetPhoto(missing_pet_id=missing_id, url=url)
    db.add(photo)
    await db.flush()
    return MessageResponse(message="Photo uploaded")


@router.post("/{missing_id}/sightings", response_model=SightingOut, status_code=201)
async def add_sighting(
    missing_id: uuid.UUID,
    data: SightingCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    sighting = MissingPetSighting(
        missing_pet_id=missing_id, reported_by_id=current_user.id, **data.model_dump()
    )
    db.add(sighting)
    await db.flush()
    return sighting


@router.get("/{missing_id}/sightings", response_model=List[SightingOut])
async def list_sightings(missing_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MissingPetSighting).where(MissingPetSighting.missing_pet_id == missing_id)
    )
    return result.scalars().all()

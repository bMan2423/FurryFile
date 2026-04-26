from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.appointment import AppointmentSlot, Appointment, AppointmentStatus
from app.models.pet import Pet
from app.schemas.appointment import SlotCreate, SlotOut, AppointmentCreate, AppointmentOut, CancelRequest
from app.schemas.common import MessageResponse
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.permissions import require_roles
from app.services import notification_service
from app.models.notification import NotificationType

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _appt_with_pet_name(appt: Appointment) -> AppointmentOut:
    out = AppointmentOut.model_validate(appt)
    if appt.pet:
        out.pet_name = appt.pet.name
    return out


_load_pet = selectinload(Appointment.pet)


@router.get("/slots", response_model=List[SlotOut])
async def list_slots(provider_id: uuid.UUID = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = select(AppointmentSlot).where(AppointmentSlot.is_available == True)
    if provider_id:
        query = query.where(AppointmentSlot.provider_id == provider_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/slots", response_model=SlotOut, status_code=201)
async def create_slot(data: SlotCreate, current_user: User = Depends(require_roles(UserRole.veterinarian, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    slot = AppointmentSlot(provider_id=current_user.id, **data.model_dump())
    db.add(slot)
    await db.flush()
    return slot


@router.get("", response_model=List[AppointmentOut])
async def list_appointments(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.veterinarian:
        query = select(Appointment).where(Appointment.provider_id == current_user.id)
    else:
        query = select(Appointment).where(Appointment.owner_id == current_user.id)
    result = await db.execute(
        query.options(_load_pet).order_by(Appointment.created_at.desc())
    )
    return [_appt_with_pet_name(a) for a in result.scalars().all()]


@router.post("", response_model=AppointmentOut, status_code=201)
async def book_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    appt = Appointment(owner_id=current_user.id, **data.model_dump())
    db.add(appt)
    if data.slot_id:
        slot_result = await db.execute(select(AppointmentSlot).where(AppointmentSlot.id == data.slot_id))
        slot = slot_result.scalar_one_or_none()
        if slot:
            slot.is_available = False
    await db.flush()

    # Fetch names for notification
    pet_result = await db.execute(select(Pet).where(Pet.id == data.pet_id))
    pet = pet_result.scalar_one_or_none()
    provider_result = await db.execute(select(User).where(User.id == data.provider_id))
    provider = provider_result.scalar_one_or_none()

    pet_name = pet.name if pet else "your pet"
    provider_name = provider.full_name if provider else "the provider"
    appt_type = data.appointment_type.replace("_", " ").title()
    provider_id_val = data.provider_id
    appt_id = appt.id

    # Notify owner (booking confirmation)
    await notification_service.create_notification(
        db, current_user.id,
        NotificationType.appointment_reminder,
        title="Appointment Booked",
        body=f"Your {appt_type} appointment for {pet_name} with {provider_name} has been booked and is pending confirmation.",
        action_url="/appointments",
        send_email=False,
    )

    # Notify provider only if different from owner
    if provider and provider_id_val != current_user.id:
        await notification_service.create_notification(
            db, provider_id_val,
            NotificationType.appointment_reminder,
            title="New Appointment Request",
            body=f"{current_user.full_name} has booked a {appt_type} appointment for {pet_name}. Please review and confirm.",
            action_url="/appointments",
            send_email=False,
        )

    await db.commit()
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appt_id))
    return _appt_with_pet_name(result.scalar_one())


@router.patch("/{appointment_id}/confirm", response_model=AppointmentOut)
async def confirm(appointment_id: uuid.UUID, current_user: User = Depends(require_roles(UserRole.veterinarian, UserRole.admin)), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise NotFoundException("Appointment not found")
    appt.status = AppointmentStatus.confirmed
    owner_id = appt.owner_id
    appt_type = appt.appointment_type.replace("_", " ").title()

    await notification_service.create_notification(
        db, owner_id,
        NotificationType.appointment_reminder,
        title="Appointment Confirmed",
        body=f"Your {appt_type} appointment has been confirmed by {current_user.full_name}.",
        action_url="/appointments",
        send_email=False,
    )

    await db.commit()
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    return _appt_with_pet_name(result.scalar_one())


@router.patch("/{appointment_id}/complete", response_model=AppointmentOut)
async def complete(appointment_id: uuid.UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise NotFoundException("Appointment not found")
    appt.status = AppointmentStatus.completed
    await db.commit()
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    return _appt_with_pet_name(result.scalar_one())


@router.patch("/{appointment_id}/cancel", response_model=AppointmentOut)
async def cancel(
    appointment_id: uuid.UUID,
    body: CancelRequest = CancelRequest(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise NotFoundException("Appointment not found")
    if appt.owner_id != current_user.id and appt.provider_id != current_user.id:
        raise ForbiddenException()

    appt.status = AppointmentStatus.cancelled
    if body.reason:
        appt.cancellation_reason = body.reason

    appt_type = appt.appointment_type.replace("_", " ").title()
    provider_id = appt.provider_id
    owner_id = appt.owner_id

    # Notify provider if owner is cancelling
    if appt.owner_id == current_user.id and provider_id != current_user.id:
        await notification_service.create_notification(
            db, provider_id,
            NotificationType.appointment_reminder,
            title="Appointment Cancelled",
            body=f"{current_user.full_name} has cancelled their {appt_type} appointment."
            + (f" Reason: {body.reason}" if body.reason else ""),
            action_url="/appointments",
            send_email=False,
        )
    # Notify owner if provider is cancelling
    elif appt.provider_id == current_user.id and owner_id != current_user.id:
        await notification_service.create_notification(
            db, owner_id,
            NotificationType.appointment_reminder,
            title="Appointment Cancelled",
            body=f"Your {appt_type} appointment has been cancelled by the provider."
            + (f" Reason: {body.reason}" if body.reason else ""),
            action_url="/appointments",
            send_email=False,
        )

    await db.commit()
    result = await db.execute(select(Appointment).options(_load_pet).where(Appointment.id == appointment_id))
    return _appt_with_pet_name(result.scalar_one())


# Keep DELETE for backwards compat — delegates to cancel
@router.delete("/{appointment_id}", response_model=MessageResponse)
async def cancel_delete(appointment_id: uuid.UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    await cancel(appointment_id, CancelRequest(), current_user, db)
    return MessageResponse(message="Appointment cancelled")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.community import Event, EventAttendee, EventAttendeePet, EventStatus, RsvpStatus
from app.schemas.common import MessageResponse
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.permissions import require_roles
from pydantic import BaseModel
from datetime import datetime
from app.services import notification_service
from app.models.notification import NotificationType

# ── Request schemas ──────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    max_attendees: Optional[int] = None
    is_virtual: bool = False
    meeting_url: Optional[str] = None

class RsvpCreate(BaseModel):
    attendee_count: int = 1
    bringing_pets: bool = False
    pet_ids: List[uuid.UUID] = []

class EventCancelRequest(BaseModel):
    reason: str

# ── Response schemas ─────────────────────────────────────────────

class MyRsvpOut(BaseModel):
    id: uuid.UUID
    attendee_count: int
    bringing_pets: bool
    pet_ids: List[uuid.UUID] = []

class EventOut(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    title: str
    description: Optional[str] = None
    event_date: datetime
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    max_attendees: Optional[int] = None
    is_virtual: bool
    meeting_url: Optional[str] = None
    status: EventStatus
    cancel_reason: Optional[str] = None
    created_at: datetime
    total_attendees: int = 0
    my_rsvp: Optional[MyRsvpOut] = None
    model_config = {"from_attributes": True}


def _build_event_out(event: Event, current_user_id: uuid.UUID) -> EventOut:
    total = sum(a.attendee_count for a in event.attendees)
    my_row = next((a for a in event.attendees if a.user_id == current_user_id), None)
    my_rsvp = None
    if my_row:
        my_rsvp = MyRsvpOut(
            id=my_row.id,
            attendee_count=my_row.attendee_count,
            bringing_pets=my_row.bringing_pets,
            pet_ids=[ap.pet_id for ap in my_row.pet_links],
        )
    return EventOut(
        id=event.id,
        organizer_id=event.organizer_id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        location_name=event.location_name,
        location_lat=float(event.location_lat) if event.location_lat else None,
        location_lng=float(event.location_lng) if event.location_lng else None,
        max_attendees=event.max_attendees,
        is_virtual=event.is_virtual,
        meeting_url=event.meeting_url,
        status=event.status,
        cancel_reason=event.cancel_reason,
        created_at=event.created_at,
        total_attendees=total,
        my_rsvp=my_rsvp,
    )


_ATTENDEE_OPTS = selectinload(Event.attendees).selectinload(EventAttendee.pet_links)

router = APIRouter(prefix="/community", tags=["Community"])

# ── List events ──────────────────────────────────────────────────

@router.get("/events", response_model=List[EventOut])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.admin:
        result = await db.execute(
            select(Event).options(_ATTENDEE_OPTS).order_by(Event.event_date)
        )
    else:
        # Approved events visible to everyone; pending_approval only visible to the organizer
        from sqlalchemy import or_, and_
        result = await db.execute(
            select(Event)
            .where(
                or_(
                    Event.status == EventStatus.upcoming,
                    and_(
                        Event.status == EventStatus.pending_approval,
                        Event.organizer_id == current_user.id,
                    ),
                )
            )
            .options(_ATTENDEE_OPTS)
            .order_by(Event.event_date)
        )
    events = result.scalars().all()
    return [_build_event_out(e, current_user.id) for e in events]


# ── Create event ─────────────────────────────────────────────────

@router.post("/events", response_model=EventOut, status_code=201)
async def create_event(
    data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    initial_status = (
        EventStatus.upcoming if current_user.role == UserRole.admin
        else EventStatus.pending_approval
    )
    event = Event(organizer_id=current_user.id, status=initial_status, **data.model_dump())
    db.add(event)
    await db.commit()
    result = await db.execute(
        select(Event).where(Event.id == event.id).options(_ATTENDEE_OPTS)
    )
    return _build_event_out(result.scalar_one(), current_user.id)


# ── Admin: approve / reject ──────────────────────────────────────

@router.patch("/events/{event_id}/approve", response_model=EventOut)
async def approve_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    event.status = EventStatus.upcoming
    await db.commit()
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    return _build_event_out(result.scalar_one(), current_user.id)


@router.patch("/events/{event_id}/reject", response_model=EventOut)
async def reject_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_roles(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    event.status = EventStatus.cancelled
    await db.commit()
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    return _build_event_out(result.scalar_one(), current_user.id)


# ── Organizer: cancel event ──────────────────────────────────────

@router.patch("/events/{event_id}/cancel", response_model=EventOut)
async def cancel_event(
    event_id: uuid.UUID,
    body: EventCancelRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    if event.organizer_id != current_user.id and current_user.role != UserRole.admin:
        raise ForbiddenException()
    if event.status not in (EventStatus.upcoming, EventStatus.pending_approval):
        raise HTTPException(status_code=400, detail="Only upcoming events can be cancelled")
    event.status = EventStatus.cancelled
    event.cancel_reason = body.reason
    await db.commit()
    result = await db.execute(select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS))
    return _build_event_out(result.scalar_one(), current_user.id)


# ── Get single event ─────────────────────────────────────────────

@router.get("/events/{event_id}", response_model=EventOut)
async def get_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    return _build_event_out(event, current_user.id)


# ── RSVP ─────────────────────────────────────────────────────────

@router.post("/events/{event_id}/rsvp", response_model=EventOut, status_code=201)
async def rsvp(
    event_id: uuid.UUID,
    data: RsvpCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    if event.status != EventStatus.upcoming:
        raise HTTPException(status_code=400, detail="Can only RSVP to upcoming events")

    # Remove old RSVP if exists
    existing = await db.execute(
        select(EventAttendee).where(
            EventAttendee.event_id == event_id,
            EventAttendee.user_id == current_user.id,
        )
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    attendee = EventAttendee(
        event_id=event_id,
        user_id=current_user.id,
        attendee_count=max(1, data.attendee_count),
        bringing_pets=data.bringing_pets,
    )
    db.add(attendee)
    await db.flush()

    if data.bringing_pets and data.pet_ids:
        for pet_id in data.pet_ids:
            db.add(EventAttendeePet(attendee_id=attendee.id, pet_id=pet_id))

    # Save before commit (commit expires ORM objects)
    organizer_id = event.organizer_id
    event_title  = event.title
    event_date   = event.event_date
    is_new_rsvp  = not old

    await db.commit()

    # Confirm RSVP to the person who just RSVP'd
    pets_note  = f" and bringing {len(data.pet_ids)} pet(s)" if data.bringing_pets and data.pet_ids else (" and bringing pets" if data.bringing_pets else "")
    count_note = f"{data.attendee_count} {'person' if data.attendee_count == 1 else 'people'}"
    date_str   = event_date.strftime("%A, %B %d at %I:%M %p") if event_date else ""
    await notification_service.create_notification(
        db, current_user.id,
        NotificationType.community,
        title=f"RSVP Confirmed: {event_title}",
        body=(f"You're going to" if is_new_rsvp else "You updated your RSVP for") + f" '{event_title}' with {count_note}{pets_note}. Event: {date_str}.",
        action_url="/community",
        send_email=False,
    )
    await db.commit()

    # Notify organizer about new RSVP (only if it is a new RSVP, not an update)
    if is_new_rsvp and organizer_id != current_user.id:
        pets_note  = f" and bringing {len(data.pet_ids)} pet(s)" if data.bringing_pets and data.pet_ids else (" and bringing pets" if data.bringing_pets else "")
        count_note = f"{data.attendee_count} {'person' if data.attendee_count == 1 else 'people'}"
        await notification_service.create_notification(
            db, organizer_id,
            NotificationType.community,
            title=f"New RSVP for {event_title}",
            body=f"{current_user.full_name} has RSVP'd to your event with {count_note}{pets_note}.",
            action_url="/community",
            send_email=False,
        )
        await db.commit()

    result = await db.execute(
        select(Event).where(Event.id == event_id).options(_ATTENDEE_OPTS)
    )
    return _build_event_out(result.scalar_one(), current_user.id)


@router.delete("/events/{event_id}/rsvp", response_model=MessageResponse)
async def cancel_rsvp(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EventAttendee).where(
            EventAttendee.event_id == event_id,
            EventAttendee.user_id == current_user.id,
        )
    )
    attendee = result.scalar_one_or_none()
    if attendee:
        await db.delete(attendee)
        await db.commit()
    return MessageResponse(message="RSVP cancelled")

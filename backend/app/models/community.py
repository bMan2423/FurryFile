import uuid, enum
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, Text, Numeric, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class EventStatus(str, enum.Enum):
    upcoming = "upcoming"; ongoing = "ongoing"; completed = "completed"; cancelled = "cancelled"; pending_approval = "pending_approval"

class RsvpStatus(str, enum.Enum):
    going = "going"; maybe = "maybe"; not_going = "not_going"

class Event(Base):
    __tablename__ = "events"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organizer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location_name: Mapped[str | None] = mapped_column(String(255))
    location_lat: Mapped[float | None] = mapped_column(Numeric(10, 7))
    location_lng: Mapped[float | None] = mapped_column(Numeric(10, 7))
    max_attendees: Mapped[int | None] = mapped_column(Integer)
    is_virtual: Mapped[bool] = mapped_column(Boolean, default=False)
    meeting_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[EventStatus] = mapped_column(Enum(EventStatus), default=EventStatus.upcoming)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    attendees = relationship("EventAttendee", back_populates="event", cascade="all, delete-orphan")

class EventAttendee(Base):
    __tablename__ = "event_attendees"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    rsvp_status: Mapped[RsvpStatus] = mapped_column(Enum(RsvpStatus), default=RsvpStatus.going)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    event = relationship("Event", back_populates="attendees")

import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Text, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


class ServiceType(str, enum.Enum):
    boarding = "boarding"
    day_care = "day_care"
    walking = "walking"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class SitterAvailability(Base):
    __tablename__ = "sitter_availability"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sitter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    sitter: Mapped["User"] = relationship("User")  # noqa


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pet_id: Mapped[str] = mapped_column(String(36), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sitter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_type: Mapped[ServiceType] = mapped_column(SAEnum(ServiceType), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus), default=BookingStatus.pending, nullable=False)
    price_per_day: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    special_instructions: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    pet: Mapped["Pet"] = relationship("Pet")  # noqa
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])  # noqa
    sitter: Mapped["User"] = relationship("User", foreign_keys=[sitter_id])  # noqa
    review: Mapped[Optional["BookingReview"]] = relationship("BookingReview", back_populates="booking", uselist=False)


class BookingReview(Base):
    __tablename__ = "booking_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="review")
    reviewer: Mapped["User"] = relationship("User")  # noqa

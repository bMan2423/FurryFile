import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Text, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey, Integer, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


class AdoptionStatus(str, enum.Enum):
    available = "available"
    pending = "pending"
    adopted = "adopted"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AdoptionListing(Base):
    __tablename__ = "adoption_listings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shelter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pet_name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[str] = mapped_column(String(50), nullable=False)
    breed: Mapped[Optional[str]] = mapped_column(String(100))
    age_years: Mapped[Optional[float]] = mapped_column(Numeric(4, 1))
    gender: Mapped[Optional[str]] = mapped_column(String(20))
    description: Mapped[Optional[str]] = mapped_column(Text)
    requirements: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[AdoptionStatus] = mapped_column(SAEnum(AdoptionStatus), default=AdoptionStatus.available, nullable=False)
    # Store photo URLs as JSON text (compatible with all DB backends)
    photos_urls: Mapped[Optional[str]] = mapped_column(Text)  # JSON array string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    shelter: Mapped["User"] = relationship("User")  # noqa
    applications: Mapped[list["AdoptionApplication"]] = relationship("AdoptionApplication", back_populates="listing", cascade="all, delete-orphan")


class AdoptionApplication(Base):
    __tablename__ = "adoption_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id: Mapped[str] = mapped_column(String(36), ForeignKey("adoption_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[ApplicationStatus] = mapped_column(SAEnum(ApplicationStatus), default=ApplicationStatus.pending, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    listing: Mapped["AdoptionListing"] = relationship("AdoptionListing", back_populates="applications")
    applicant: Mapped["User"] = relationship("User")  # noqa


class VolunteerOpportunity(Base):
    __tablename__ = "volunteer_opportunities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    shelter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    date: Mapped[Optional[str]] = mapped_column(String(50))
    slots_available: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    shelter: Mapped["User"] = relationship("User")  # noqa
    signups: Mapped[list["VolunteerSignup"]] = relationship("VolunteerSignup", back_populates="opportunity", cascade="all, delete-orphan")


class VolunteerSignup(Base):
    __tablename__ = "volunteer_signups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id: Mapped[str] = mapped_column(String(36), ForeignKey("volunteer_opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    opportunity: Mapped["VolunteerOpportunity"] = relationship("VolunteerOpportunity", back_populates="signups")
    user: Mapped["User"] = relationship("User")  # noqa

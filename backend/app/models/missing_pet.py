import uuid, enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class MissingStatus(str, enum.Enum):
    missing = "missing"
    found = "found"
    reunited = "reunited"

class MissingPet(Base):
    __tablename__ = "missing_pets"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"))
    reported_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    status: Mapped[MissingStatus] = mapped_column(Enum(MissingStatus), default=MissingStatus.missing)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen_address: Mapped[Optional[str]] = mapped_column(Text)
    last_seen_lat: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))
    last_seen_lng: Mapped[Optional[float]] = mapped_column(Numeric(10, 7))
    description: Mapped[Optional[str]] = mapped_column(Text)
    reward_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(30))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    # Track when the last "10-day" broadcast was sent
    last_notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    pet = relationship("Pet")
    reporter = relationship("User", foreign_keys=[reported_by_id])
    photos = relationship("MissingPetPhoto", back_populates="missing_pet", cascade="all, delete-orphan")
    sightings = relationship("MissingPetSighting", back_populates="missing_pet", cascade="all, delete-orphan")

class MissingPetPhoto(Base):
    __tablename__ = "missing_pet_photos"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    missing_pet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("missing_pets.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    missing_pet = relationship("MissingPet", back_populates="photos")

class MissingPetSighting(Base):
    __tablename__ = "missing_pet_sightings"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    missing_pet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("missing_pets.id", ondelete="CASCADE"))
    reported_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    sighting_lat: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    sighting_lng: Mapped[float] = mapped_column(Numeric(10, 7), nullable=False)
    sighted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    missing_pet = relationship("MissingPet", back_populates="sightings")

import uuid
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Text, Numeric, DateTime, Date, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


class PetSpecies(str, enum.Enum):
    dog = "dog"
    cat = "cat"
    bird = "bird"
    rabbit = "rabbit"
    fish = "fish"
    reptile = "reptile"
    other = "other"


class PetGender(str, enum.Enum):
    male = "male"
    female = "female"
    unknown = "unknown"


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    species: Mapped[PetSpecies] = mapped_column(SAEnum(PetSpecies), nullable=False)
    breed: Mapped[Optional[str]] = mapped_column(String(100))
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    gender: Mapped[PetGender] = mapped_column(SAEnum(PetGender), default=PetGender.unknown, nullable=False)
    weight: Mapped[Optional[float]] = mapped_column(Numeric(6, 2))  # kg
    color: Mapped[Optional[str]] = mapped_column(String(100))
    microchip_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    is_neutered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="pets")  # noqa
    photos: Mapped[list["PetPhoto"]] = relationship("PetPhoto", back_populates="pet", cascade="all, delete-orphan", lazy="selectin")
    vaccinations: Mapped[list["Vaccination"]] = relationship("Vaccination", back_populates="pet", cascade="all, delete-orphan")  # noqa
    allergies: Mapped[list["Allergy"]] = relationship("Allergy", back_populates="pet", cascade="all, delete-orphan")  # noqa


class PetPhoto(Base):
    __tablename__ = "pet_photos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pet_id: Mapped[str] = mapped_column(String(36), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    pet: Mapped["Pet"] = relationship("Pet", back_populates="photos")

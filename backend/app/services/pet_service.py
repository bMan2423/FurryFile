from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.models.pet import Pet, PetPhoto
from app.models.user import User
from app.schemas.pet import PetCreateRequest, PetUpdateRequest
from app.core.exceptions import NotFoundException, ForbiddenException


async def get_user_pets(db: AsyncSession, owner_id: str) -> List[Pet]:
    result = await db.execute(
        select(Pet).where(Pet.owner_id == owner_id, Pet.is_active == True)
    )
    return list(result.scalars().all())


async def get_pet_by_id(db: AsyncSession, pet_id: str) -> Pet:
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise NotFoundException("Pet not found")
    return pet


async def create_pet(db: AsyncSession, data: PetCreateRequest, owner_id: str) -> Pet:
    pet = Pet(owner_id=owner_id, **data.model_dump())
    db.add(pet)
    await db.flush()
    return pet


async def update_pet(db: AsyncSession, pet_id: str, data: PetUpdateRequest, current_user: User) -> Pet:
    pet = await get_pet_by_id(db, pet_id)
    if pet.owner_id != current_user.id and current_user.role.value != "admin":
        raise ForbiddenException("You do not own this pet")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pet, field, value)
    return pet


async def delete_pet(db: AsyncSession, pet_id: str, current_user: User) -> None:
    pet = await get_pet_by_id(db, pet_id)
    if pet.owner_id != current_user.id and current_user.role.value != "admin":
        raise ForbiddenException("You do not own this pet")
    pet.is_active = False  # Soft delete


async def add_pet_photo(db: AsyncSession, pet_id: str, url: str, is_primary: bool, caption: Optional[str]) -> PetPhoto:
    # Unset existing primary if needed
    if is_primary:
        result = await db.execute(
            select(PetPhoto).where(PetPhoto.pet_id == pet_id, PetPhoto.is_primary == True)
        )
        for photo in result.scalars().all():
            photo.is_primary = False

    photo = PetPhoto(pet_id=pet_id, url=url, is_primary=is_primary, caption=caption)
    db.add(photo)
    await db.flush()
    return photo


async def delete_pet_photo(db: AsyncSession, pet_id: str, photo_id: str, current_user: User) -> str:
    """Returns URL for physical file deletion."""
    result = await db.execute(
        select(PetPhoto).where(PetPhoto.id == photo_id, PetPhoto.pet_id == pet_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise NotFoundException("Photo not found")

    pet = await get_pet_by_id(db, pet_id)
    if pet.owner_id != current_user.id and current_user.role.value != "admin":
        raise ForbiddenException()

    url = photo.url
    await db.delete(photo)
    return url

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.pet import PetCreateRequest, PetUpdateRequest, PetResponse, PetPhotoResponse
from app.schemas.common import MessageResponse
from app.services import pet_service
from app.core.storage import save_upload, delete_upload

router = APIRouter()


@router.get("", response_model=List[PetResponse])
async def list_pets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await pet_service.get_user_pets(db, current_user.id)


@router.post("", response_model=PetResponse, status_code=201)
async def create_pet(
    data: PetCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await pet_service.create_pet(db, data, current_user.id)


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await pet_service.get_pet_by_id(db, pet_id)


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: str,
    data: PetUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await pet_service.update_pet(db, pet_id, data, current_user)


@router.delete("/{pet_id}", response_model=MessageResponse)
async def delete_pet(
    pet_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await pet_service.delete_pet(db, pet_id, current_user)
    return {"message": "Pet deleted"}


@router.post("/{pet_id}/photos", response_model=PetPhotoResponse, status_code=201)
async def upload_pet_photo(
    pet_id: str,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    caption: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await save_upload(file, subfolder="pets")
    photo = await pet_service.add_pet_photo(db, pet_id, url, is_primary, caption)
    return photo


@router.delete("/{pet_id}/photos/{photo_id}", response_model=MessageResponse)
async def delete_pet_photo(
    pet_id: str,
    photo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await pet_service.delete_pet_photo(db, pet_id, photo_id, current_user)
    delete_upload(url)
    return {"message": "Photo deleted"}

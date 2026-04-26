from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdateRequest
from app.core.storage import save_upload
from app.core.exceptions import ForbiddenException

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    return current_user


@router.post("/me/photo", response_model=UserResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await save_upload(file, subfolder="profiles")
    current_user.profile_photo_url = url
    return current_user


@router.get("/sitters", response_model=list[UserResponse])
async def list_sitters(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.role == UserRole.pet_sitter, User.is_active == True)
    )
    return list(result.scalars().all())


@router.get("/vets", response_model=list[UserResponse])
async def list_vets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.role == UserRole.veterinarian, User.is_active == True)
    )
    return list(result.scalars().all())

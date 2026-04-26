from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.db.session import get_db
from app.dependencies import require_roles
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.user import UserResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_roles("admin"))])
async def admin_list_users(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())


@router.patch("/users/{user_id}/toggle-active", dependencies=[Depends(require_roles("admin"))])
async def toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("User not found")
    user.is_active = not user.is_active
    return {"id": user.id, "is_active": user.is_active}


@router.get("/audit-logs", response_model=List[AuditLogResponse], dependencies=[Depends(require_roles("admin"))])
async def admin_audit_logs(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


@router.get("/stats", dependencies=[Depends(require_roles("admin"))])
async def admin_stats(db: AsyncSession = Depends(get_db)):
    """Basic platform statistics for the admin dashboard."""
    from app.models.pet import Pet
    from app.models.missing_pet import MissingPet
    from app.models.adoption import AdoptionListing

    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    pet_count = (await db.execute(select(func.count(Pet.id)))).scalar()
    missing_count = (await db.execute(select(func.count(MissingPet.id)))).scalar()
    adoption_count = (await db.execute(select(func.count(AdoptionListing.id)))).scalar()

    return {
        "users": user_count,
        "pets": pet_count,
        "missing_reports": missing_count,
        "adoption_listings": adoption_count,
    }

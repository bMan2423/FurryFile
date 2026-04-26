from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingReview
from app.schemas.booking import (
    BookingCreateRequest, BookingUpdateRequest,
    BookingReviewCreateRequest, BookingReviewResponse, BookingResponse,
)
from app.core.exceptions import NotFoundException, ForbiddenException

router = APIRouter()


@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Booking)
    if current_user.role.value == "pet_sitter":
        query = query.where(Booking.sitter_id == current_user.id)
    else:
        query = query.where(Booking.owner_id == current_user.id)
    result = await db.execute(query.order_by(Booking.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    data: BookingCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = Booking(owner_id=current_user.id, **data.model_dump())
    db.add(booking)
    await db.flush()
    return booking


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    data: BookingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise NotFoundException("Booking not found")
    if booking.owner_id != current_user.id and booking.sitter_id != current_user.id:
        raise ForbiddenException()

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    return booking


@router.post("/{booking_id}/review", response_model=BookingReviewResponse, status_code=201)
async def create_review(
    booking_id: str,
    data: BookingReviewCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise NotFoundException("Booking not found")
    if booking.owner_id != current_user.id:
        raise ForbiddenException("Only the owner can leave a review")

    review = BookingReview(
        booking_id=booking_id,
        reviewer_id=current_user.id,
        **data.model_dump(),
    )
    db.add(review)
    await db.flush()
    return review

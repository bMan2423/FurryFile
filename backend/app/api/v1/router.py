from fastapi import APIRouter
from app.api.v1 import auth, users, pets, health, appointments, bookings, missing_pets, adoption, notifications, community, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pets.router, prefix="/pets", tags=["pets"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(missing_pets.router, prefix="/missing-pets", tags=["missing-pets"])
api_router.include_router(adoption.router, prefix="/adoption", tags=["adoption"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

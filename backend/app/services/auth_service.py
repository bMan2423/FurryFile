from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, RefreshToken, PasswordResetToken
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, hash_refresh_token
from app.core.exceptions import ConflictException, UnauthorizedException, BadRequestException, ForbiddenException
from app.core.email import send_welcome_email, send_password_reset_email
from app.config import settings
import secrets


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    # Ensure email is unique
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
    )
    db.add(user)
    await db.flush()
    await send_welcome_email(user.email, user.full_name)
    return user


async def login_user(db: AsyncSession, data: LoginRequest) -> tuple[str, str, User]:
    """Returns (access_token, raw_refresh_token, user)."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")
    if not user.is_active:
        raise ForbiddenException("Account is deactivated")  # noqa

    access_token = create_access_token(user.id, user.role.value)
    raw_token, token_hash = create_refresh_token()

    refresh = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh)
    return access_token, raw_token, user


async def refresh_tokens(db: AsyncSession, raw_token: str) -> tuple[str, str]:
    """Validate refresh token and issue new pair."""
    token_hash = hash_refresh_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise UnauthorizedException("Invalid or expired refresh token")

    # Rotate token
    await db.delete(stored)

    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException()

    new_access = create_access_token(user.id, user.role.value)
    new_raw, new_hash = create_refresh_token()

    new_refresh = RefreshToken(
        user_id=user.id,
        token_hash=new_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_refresh)
    return new_access, new_raw


async def logout_user(db: AsyncSession, raw_token: str) -> None:
    token_hash = hash_refresh_token(raw_token)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    stored = result.scalar_one_or_none()
    if stored:
        await db.delete(stored)


async def forgot_password(db: AsyncSession, email: str) -> None:
    """Generate a reset token and email it. Always succeeds silently to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        return

    # Invalidate any existing reset tokens for this user
    existing = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )
    for token in existing.scalars().all():
        await db.delete(token)

    raw_token = secrets.token_urlsafe(64)
    token_hash = hash_refresh_token(raw_token)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.add(reset_token)
    await db.flush()
    await send_password_reset_email(user.email, raw_token)


async def reset_password(db: AsyncSession, raw_token: str, new_password: str) -> None:
    token_hash = hash_refresh_token(raw_token)
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise BadRequestException("Invalid or expired reset link")

    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise BadRequestException("Invalid or expired reset link")

    user.hashed_password = hash_password(new_password)
    await db.delete(stored)

    # Revoke all refresh tokens so existing sessions are invalidated
    tokens = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
    for t in tokens.scalars().all():
        await db.delete(t)

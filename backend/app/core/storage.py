import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from PIL import Image
import io
from app.config import settings


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def save_upload(file: UploadFile, subfolder: str = "general") -> str:
    """Save uploaded file to disk and return its public URL path."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Unsupported file type: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise ValueError(f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB")

    # Resize large images to save space
    img = Image.open(io.BytesIO(content))
    if img.width > 1200 or img.height > 1200:
        img.thumbnail((1200, 1200), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format=img.format or "JPEG", quality=85)
        content = buf.getvalue()

    ext = Path(file.filename or "file.jpg").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    filepath = upload_dir / filename
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    return f"/uploads/{subfolder}/{filename}"


def delete_upload(url_path: str) -> None:
    """Remove a file given its URL path (e.g. /uploads/pets/abc.jpg)."""
    if not url_path.startswith("/uploads/"):
        return
    relative = url_path.removeprefix("/uploads/")
    filepath = Path(settings.UPLOAD_DIR) / relative
    if filepath.exists():
        filepath.unlink()

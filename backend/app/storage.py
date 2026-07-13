import logging
import os
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader

from app.config import settings

logger = logging.getLogger("app.storage")

_cloudinary_configured = bool(
    settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET
)

if _cloudinary_configured:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

MEDIA_ROOT = Path(settings.MEDIA_ROOT)
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".mp4"}


def is_cloudinary_configured() -> bool:
    return _cloudinary_configured


def validate_upload(filename: str, size_bytes: int) -> None:
    """Raises ValueError if the file fails type/size validation."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext}' is not allowed. Allowed types: {sorted(ALLOWED_EXTENSIONS)}")
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise ValueError(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB}MB")


def upload_bytes(data: bytes, filename: str, folder: str = "uploads") -> str:
    """Upload raw bytes to Cloudinary, or fall back to local disk under MEDIA_ROOT.

    Returns a publicly accessible URL (or local-relative path in dev fallback mode).
    """
    ext = Path(filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"

    if _cloudinary_configured:
        try:
            result = cloudinary.uploader.upload(
                data,
                public_id=f"{folder}/{Path(unique_name).stem}",
                resource_type="auto",
            )
            return result["secure_url"]
        except Exception as exc:  # noqa: BLE001 - external service, never let it crash the request
            logger.warning("Cloudinary upload failed, falling back to local disk: %s", exc)

    dest_dir = MEDIA_ROOT / folder
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / unique_name
    with open(dest_path, "wb") as fh:
        fh.write(data)

    return f"/media/{folder}/{unique_name}"


def upload_file_path(local_path: str, folder: str = "uploads") -> str:
    """Upload a file already on disk (used for generated PDFs like certificates)."""
    with open(local_path, "rb") as fh:
        data = fh.read()
    return upload_bytes(data, os.path.basename(local_path), folder=folder)

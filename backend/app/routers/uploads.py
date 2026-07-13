from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.upload import UploadOut
from app.storage import upload_bytes, validate_upload

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    folder: str = Query(default="uploads", pattern=r"^[a-zA-Z0-9_-]{1,64}$"),
    current_user: User = Depends(get_current_user),
) -> UploadOut:
    data = await file.read()

    try:
        validate_upload(file.filename or "", len(data))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    url = upload_bytes(data, file.filename or "upload", folder=folder)
    return UploadOut(url=url)

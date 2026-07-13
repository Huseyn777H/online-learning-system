from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import (
    admin,
    assignments,
    auth,
    categories,
    certificates,
    courses,
    enrollments,
    lessons,
    modules,
    notifications,
    quizzes,
    uploads,
    users,
)

app = FastAPI(title="Online Learning System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

media_root = Path(settings.MEDIA_ROOT)
media_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

api_prefix = "/api"

app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(courses.router, prefix=api_prefix)
app.include_router(modules.router, prefix=api_prefix)
app.include_router(lessons.router, prefix=api_prefix)
app.include_router(assignments.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(quizzes.router, prefix=api_prefix)
app.include_router(certificates.router, prefix=api_prefix)
app.include_router(enrollments.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)


@app.get("/")
def health_check() -> dict:
    return {"status": "ok", "service": "online-learning-system-api"}

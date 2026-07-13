# Online Learning System — Backend

FastAPI backend for the Online Learning System (LMS). See `../docs/API_SPEC.md` for the full API contract.

## Tech stack

Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, Redis, JWT (python-jose) + bcrypt (passlib), Cloudinary (with local-disk fallback), ReportLab (PDF certificates).

## Running with Docker Compose (recommended)

From the project root (`online-learning-system/`):

```bash
cp backend/.env.example backend/.env
# edit backend/.env if needed (JWT_SECRET, Cloudinary creds, etc.)
docker compose up --build
```

This starts Postgres, Redis, the backend (running migrations automatically then `uvicorn --reload`), and the frontend. The API is available at `http://localhost:8001` (host port remapped to avoid a local port 8000 conflict — see `docker-compose.yml`), docs at `http://localhost:8001/docs`.

## Running locally without Docker

Requirements: Python 3.11+, a running PostgreSQL instance, a running Redis instance.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# edit .env: point DATABASE_URL / REDIS_URL at your local Postgres/Redis instances,
# e.g. postgresql+psycopg2://ols_user:ols_password@localhost:5432/ols_db
#      redis://localhost:6379/0

alembic upgrade head

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.

If `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` are left blank, file uploads (lesson content, submission answers, generated certificates) are stored on local disk under `backend/media/` instead, and served back as `/media/...` relative URLs.

## Bootstrapping the admin user

Public registration (`POST /api/auth/register`) only accepts `role: student` or `role: teacher` — it can
never create an admin account. To create the first (or an additional) admin, run the standalone
`scripts/create_admin.py` script. It is idempotent: running it again with the same email is a no-op.

Via Docker Compose:

```bash
docker compose exec backend python -m scripts.create_admin \
  --email admin@example.com --password "S3curePass!" --full-name "Site Admin"
```

Without Docker (venv active, from `backend/`):

```bash
python -m scripts.create_admin --email admin@example.com --password "S3curePass!" --full-name "Site Admin"
```

Or via environment variables instead of flags:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="S3curePass!" ADMIN_FULL_NAME="Site Admin" \
  python -m scripts.create_admin
```

## Uploading files

`POST /api/uploads` (auth required, multipart `file` field, optional `?folder=` query param, defaults to
`uploads`) validates file type (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.mp4`) and size (`MAX_UPLOAD_MB`, default
20MB), then returns `{ "url": "..." }` — a Cloudinary URL if configured, otherwise a local `/media/...`
URL. Use the returned URL as `contentUrl` when creating a lesson or `answerUrl` when submitting an
assignment.

## Alembic commands

```bash
# generate a new migration after changing models
alembic revision --autogenerate -m "description"

# apply all pending migrations
alembic upgrade head

# roll back the last migration
alembic downgrade -1
```

## Project layout

```
app/
  config.py         # pydantic-settings, reads env vars
  database.py        # SQLAlchemy engine/session/Base
  redis_client.py     # Redis connection + safe get/set/delete helpers (never raise)
  storage.py          # Cloudinary upload w/ local-disk fallback
  security.py         # password hashing + JWT
  dependencies.py      # get_current_user, require_role, get_db
  main.py            # FastAPI app, CORS, router mounting
  models/            # SQLAlchemy ORM models
  schemas/           # Pydantic v2 request/response models (camelCase)
  routers/           # one router per resource group
  services/          # progress calc, certificate PDF generation, cache helpers
alembic/             # migrations
scripts/
  create_admin.py     # one-off bootstrap script for the first admin user
```

# Online Learning System

Full-stack MVP for a web-based LMS: students enroll in courses, watch lessons, submit
assignments/quizzes and earn certificates; teachers build courses; admins manage users,
courses, categories and view platform statistics.

Built from `Online_Learning_System_Technical_Documentation_Huseyn_Akberov.docx`. Full API
contract lives in [docs/API_SPEC.md](docs/API_SPEC.md).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| Backend | Python 3.11, FastAPI |
| Database | PostgreSQL, SQLAlchemy + Alembic |
| Auth | JWT + bcrypt |
| Cache | Redis |
| Storage | Cloudinary (local `/media` fallback in dev) |

## Project layout

```
online-learning-system/
├── docker-compose.yml
├── docs/API_SPEC.md      # endpoint contract, entities, business rules
├── backend/              # FastAPI app
└── frontend/             # Next.js app
```

## Running locally (Docker Compose)

1. Copy env files:
   ```
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
2. Fill in Cloudinary credentials in `backend/.env` if you have them (optional in dev —
   falls back to local disk storage under `backend/media/`).
3. Start everything:
   ```
   docker-compose up --build
   ```
4. Services:
   - Frontend: http://localhost:3000
   - Backend API docs (Swagger): http://localhost:8001/docs
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

Alembic migrations run automatically on backend container start.

## Running without Docker

See `backend/README.md` and `frontend/README.md` for standalone setup instructions.

## Roles

- **Student** — browse/search courses, enroll, watch lessons, submit assignments/quizzes,
  track progress, download certificates.
- **Teacher** — create/manage own courses, modules, lessons, assignments, quizzes; grade
  submissions.
- **Admin** — full control over users, courses, categories; views dashboard statistics.

## Status

Phase 2-8 of the documentation's milestone plan implemented as an MVP scaffold: auth,
course catalog + search/filter, enrollment, lessons/modules/progress, assignments/grading,
quizzes (auto-graded), certificates (PDF), notifications, admin dashboard + stats, Redis
caching with DB fallback.

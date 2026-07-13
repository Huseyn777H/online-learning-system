# Online Learning System — API Contract

Source of truth for both backend (FastAPI) and frontend (Next.js) implementation.
Derived from `Online_Learning_System_Technical_Documentation_Huseyn_Akberov.docx`.

## Roles

- `student`, `teacher`, `admin` — stored on `User.role`.
- JWT payload: `{ "sub": userId, "role": role, "exp": ... }`. Sent as `Authorization: Bearer <token>`.
- Backend MUST re-check role/ownership on every protected endpoint — frontend checks are UX only.

## JSON conventions

- All request/response bodies use **camelCase** field names (matches doc), even though DB columns are snake_case.
- Timestamps are ISO-8601 strings (UTC).
- IDs are integers (autoincrement primary keys).
- Paginated list endpoints return `{ "items": [...], "total": number, "page": number, "pageSize": number }`.
- Errors return `{ "detail": "message" }` with standard HTTP status codes (400/401/403/404/422).

## Entities

| Entity | Fields |
|---|---|
| User | id, fullName, email, passwordHash (never serialized), role (`student`\|`teacher`\|`admin`), createdAt |
| Category | id, name, description |
| Course | id, title, description, categoryId, teacherId, level (`beginner`\|`intermediate`\|`advanced`), status (`draft`\|`published`\|`inactive`), createdAt |
| Module | id, courseId, title, orderIndex |
| Lesson | id, moduleId, title, contentType (`video`\|`pdf`\|`text`), contentUrl, duration (minutes) |
| LessonCompletion | id, userId, lessonId, enrollmentId, completedAt — join table backing progress calc |
| Enrollment | id, userId, courseId, progress (0-100 float), enrolledAt |
| Assignment | id, courseId, title, description, deadline, maxScore |
| Submission | id, assignmentId, studentId, answerUrl, score (nullable until graded), feedback (nullable), isLate (bool), submittedAt |
| Notification | id, userId, type, message, isRead, createdAt |
| Quiz | id, courseId, title, description, passingScore, timeLimit (minutes, nullable) |
| Question | id, quizId, questionText, options (JSON array of strings), correctAnswer (string, matches one option), score |
| QuizAttempt | id, quizId, studentId, score, submittedAt, passed (bool) |
| Certificate | id, studentId, courseId, certificateUrl, issuedAt, certificateCode (unique, human-readable e.g. `CERT-2026-000123`) |

## Business rules (enforced backend-side)

1. Only authenticated students can enroll in a course.
2. A student can only view private/lesson materials of courses they are enrolled in (teachers/admins bypass for their own courses / globally for admin).
3. A teacher can only edit/delete/add modules-lessons-assignments-quizzes to courses where `Course.teacherId == currentUser.id`.
4. Admin has full access to all courses/users/categories.
5. `Submission.isLate = true` if `submittedAt > Assignment.deadline`.
6. `Enrollment.progress` is recalculated whenever a lesson is marked complete: `progress = completedLessons / totalLessons * 100` (lessons counted across all modules of the course).
7. Certificates only generated when `Enrollment.progress == 100`. Re-requesting for the same student+course returns the existing certificate record instead of creating a duplicate.
8. Quiz scoring is fully automatic: on submit, compare each answer to `Question.correctAnswer`, sum `score` of correct ones, `passed = totalScore >= Quiz.passingScore`.

## Security requirements

- Passwords hashed with bcrypt (via passlib).
- JWT secret + DB URL + Redis URL + Cloudinary creds in `.env` (never committed — `.env.example` only).
- Input validation via Pydantic on every request body.
- Admin-only endpoints protected by a `require_role("admin")` dependency.
- File upload endpoints (lesson content, submission answers) restrict file type (pdf/png/jpg/mp4 as applicable) and size (configurable, default 20MB).

## Redis caching strategy

- Cache keys: `courses:list:{queryhash}`, `courses:search:{queryhash}`, `admin:stats`.
- TTL: 60s for list/search, 30s for admin stats.
- Invalidate `courses:*` on course create/update/delete/enroll. Invalidate `admin:stats` on user/course/enrollment/submission changes.
- If Redis is unreachable, fall back silently to DB — caching must never break a request (wrap in try/except, log a warning).

## Endpoints

### Auth
- `POST /api/auth/register` — body `{ fullName, email, password, role }` → `201 { user, accessToken }`.
  **`role` is restricted to `student` or `teacher` — public self-registration as `admin` is not allowed.**
  The first admin account is created via the `backend/scripts/create_admin.py` bootstrap script (run once
  by the operator); every subsequent admin is provisioned by an existing admin via
  `PATCH /api/admin/users/:id`.
- `POST /api/auth/login` — body `{ email, password }` → `200 { user, accessToken }`

### Users
- `GET /api/users/profile` (auth) → current user
- `PATCH /api/users/profile` (auth) — body subset of `{ fullName, email }` → updated user

### Courses
- `GET /api/courses` — query `page, pageSize, categoryId, level, teacherId, status` → paginated list (public sees only `published`)
- `POST /api/courses` (teacher/admin) — body `{ title, description, categoryId, level }` → 201 course (status defaults `draft`)
- `GET /api/courses/:id` — course detail + modules + lessons (lessons' `contentUrl` hidden unless enrolled/owner/admin)
- `PATCH /api/courses/:id` (owning teacher/admin) — partial update
- `DELETE /api/courses/:id` (owning teacher/admin) — soft delete (`status = inactive`)
- `POST /api/courses/:id/enroll` (student) → 201 Enrollment
- `GET /api/courses/search` — query `keyword, category, level, page, pageSize` e.g. `/api/courses/search?keyword=react&category=programming&level=beginner`

### Modules & Lessons
- `POST /api/modules` (owning teacher/admin) — body `{ courseId, title, orderIndex }`
- `PATCH /api/modules/:id` (owning teacher/admin)
- `POST /api/lessons` (owning teacher/admin) — body `{ moduleId, title, contentType, contentUrl, duration }`
- `PATCH /api/lessons/:id/complete` (enrolled student) → marks LessonCompletion, recalculates Enrollment.progress

### Assignments & Submissions
- `POST /api/assignments` (owning teacher/admin) — body `{ courseId, title, description, deadline, maxScore }`
- `POST /api/assignments/:id/submit` (enrolled student) — body `{ answerUrl }` → Submission (isLate computed)
- `PATCH /api/submissions/:id/grade` (owning teacher/admin) — body `{ score, feedback }` → also creates a Notification for the student

### Notifications
- `GET /api/notifications` (auth) — current user's notifications, newest first
- `PATCH /api/notifications/read` (auth) — body `{ ids: number[] }` (or empty = mark all) → marks as read

### Admin
- `GET /api/admin/stats` (admin) → `{ totalUsers, totalStudents, totalTeachers, totalCourses, activeEnrollments, assignmentsSubmitted }`
- `GET /api/admin/users` (admin) — query `page, pageSize, role` → paginated users
- `PATCH /api/admin/users/:id` (admin) — body `{ role }` role change
- `GET /api/categories` (public)
- `POST /api/categories` (admin) — body `{ name, description }`
- `PATCH /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

### Quizzes
- `POST /api/quizzes` (owning teacher/admin) — body `{ courseId, title, description, passingScore, timeLimit }`
- `POST /api/quizzes/:id/questions` (owning teacher/admin) — body `{ questionText, options: string[], correctAnswer, score }`
- `GET /api/quizzes/:id` (enrolled student/owner/admin) — quiz + questions (correctAnswer hidden from students)
- `POST /api/quizzes/:id/submit` (enrolled student) — body `{ answers: { questionId: string }[] }` → auto-graded QuizAttempt

### Certificates
- `GET /api/courses/:id/certificate` (student who owns it) → existing certificate or 404
- `POST /api/certificates/generate` (student) — body `{ courseId }` → generates PDF (reportlab), uploads to Cloudinary (or local `/media` fallback in dev), returns Certificate record. Idempotent per doc rule #7.

## Dashboard statistics cards (Admin)

Total Users · Total Students · Total Teachers · Total Courses · Active Enrollments · Assignments Submitted

## Progress formula

```
Progress = (Completed Lessons / Total Lessons) * 100
Example: (8 / 10) * 100 = 80%
```

## UI pages (frontend)

- Public: Home, Course Catalog (with keyword/category/level filter bar hitting `/api/courses/search`), Course Detail, Login, Register.
- Student dashboard: My Courses, Lesson View (with "mark complete" action), Assignments, Grades, Notifications, Profile, Certificate download.
- Teacher dashboard: My Courses, Course Builder (create course/modules/lessons), Assignments, Submissions (grade), Quiz builder.
- Admin dashboard: Users, Courses, Categories, Reports/Statistics (the 6 stat cards), Settings.

## Tech stack (fixed by documentation)

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router, TypeScript) |
| Backend | Python 3.11 + FastAPI |
| Database | PostgreSQL |
| ORM/Migrations | SQLAlchemy + Alembic |
| Auth | JWT + bcrypt (passlib) |
| Storage | Cloudinary (dev fallback: local disk under `/media`) |
| Cache | Redis |
| Deployment target | Vercel (frontend) + Render/Railway (backend) — local dev via Docker Compose |

## Addendum: senior review findings (2026-07-10)

A full review found the initial build round had frontend and backend agents independently guessing at
endpoints the original spec left undefined, producing a frontend that calls routes the backend never
implemented, plus several correctness/security gaps. This addendum is now part of the contract — both
sides must match it exactly.

### New endpoints (required — frontend already calls these; backend must implement them)

- `GET /api/enrollments` (auth, student) → `Enrollment[]`, current user's enrollments. Each item embeds
  the full `course` object (`EnrollmentWithCourseOut` = `EnrollmentOut` + `course: CourseOut`), matching
  frontend's `Enrollment.course?: Course`.
- `GET /api/assignments?courseId=` (auth) → `Assignment[]` for one course. Visible to the owning
  teacher/admin, or an enrolled student.
- `GET /api/assignments/mine` (auth, student) → `Assignment[]`, all assignments across the student's
  enrolled courses.
- `GET /api/submissions?assignmentId=` (auth) → `Submission[]` for one assignment. Owning teacher/admin
  only (same ownership check as grading).
- `GET /api/submissions/mine` (auth, student) → `Submission[]`, all of the student's own submissions.
- `GET /api/quizzes?courseId=` (auth) → `QuizDetailOut[]` (quiz + questions) for one course. Same
  visibility rule as `GET /api/quizzes/:id`: owning teacher/admin sees `correctAnswer`, enrolled students
  do not (`null`).

### Security fixes (must be enforced, not just documented)

- Public registration must reject `role: "admin"` (schema-level restriction to `student`/`teacher`).
  Bootstrap the first admin via `backend/scripts/create_admin.py` (reads credentials from CLI args or
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_FULL_NAME` env vars, idempotent — no-ops if that email already
  exists). Document this script in `backend/README.md`.
- An admin must not be able to change their own role via `PATCH /api/admin/users/:id` (prevents
  locking every admin out with no recovery path) — return `400` if `user_id == current_user.id`.
- `UserRegister.password` max length must not exceed bcrypt's 72-byte input limit (cap `max_length=72`
  in the Pydantic schema) — anything longer is silently truncated by bcrypt today, meaning two different
  passwords sharing a 72-byte prefix would both validate.

### Race-condition / error-handling consistency

Every endpoint that checks "does this already exist?" then inserts a row guarded by a DB unique
constraint has a TOCTOU race: two concurrent requests can both pass the check before either commits, and
the loser's `db.commit()` raises `IntegrityError`, which today surfaces as a raw unhandled `500`.
`app/routers/certificates.py::generate_certificate` already handles this correctly (catch
`IntegrityError`, `db.rollback()`, re-fetch and return the existing row, or convert to a clean `400`).
Apply the identical pattern to:
- `POST /api/auth/register` (duplicate email → `400`)
- `POST /api/courses/:id/enroll` (duplicate enrollment → `400`, already has a pre-check but no race guard)
- `POST /api/assignments/:id/submit` (duplicate submission → `400`, same gap)
- `PATCH /api/users/profile` (duplicate email on update → `400`)

Also: `DELETE /api/categories/:id` has no FK guard — deleting a category still referenced by courses
raises an unhandled `IntegrityError`/`500`. Check for referencing courses first and return a clean `400`
("Cannot delete a category that still has courses assigned to it") instead.

### File upload (previously dead code)

`app/storage.py` already implements `validate_upload`/`upload_bytes` (type/size limits, Cloudinary with
local-disk fallback) per the Security Requirements section above, but nothing in the API surface ever
calls it — lesson `contentUrl` and submission `answerUrl` are plain text fields with no actual upload
path, so the "file type and size limits" requirement is unenforced. Add:
- `POST /api/uploads` (auth, multipart `file` field, optional `folder` query param) → `{ url: string }`,
  using the existing `validate_upload`/`upload_bytes` helpers. Frontend's lesson-content and
  assignment-submission forms should use this to get a URL before calling `POST /api/lessons` /
  `POST /api/assignments/:id/submit`, replacing the raw text-URL inputs (a plain URL text field can
  remain as a fallback option for linking externally-hosted content, but the primary path should be a
  real upload).

### Frontend fixes required

- `lib/api.ts`: update the six "NOTE: assumed endpoint" comments now that the backend implements them for
  real — remove the disclaimers, keep the calls (paths already match this addendum).
- `lib/api.ts`'s `request()`: on a `401` response from an **authenticated** call (`auth: true`), clear the
  stored token and redirect to `/login` (avoid infinite loops: don't do this for `authApi.login`/
  `authApi.register`, which legitimately return `401`/`400` for bad credentials, not expired sessions).
- `app/teacher/courses/[id]/quiz/page.tsx`: on mount, call `quizzesApi.listByCourse(courseId)` and load
  the existing quiz (if any) instead of always showing the "Create Quiz" form — today a teacher can
  create a second, orphaned quiz for a course they already built one for, with no way to reach the first
  one's questions from the UI.
- Registration UI: no change needed (already student/teacher only), but confirm it still matches the
  now-enforced backend restriction.

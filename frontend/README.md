# Online Learning System — Frontend

Next.js 14 (App Router, TypeScript) frontend for the LMS. Talks to the FastAPI backend over
`fetch` using the contract in [`../docs/API_SPEC.md`](../docs/API_SPEC.md). Styled with
Tailwind CSS.

## Running locally (without Docker)

Requirements: Node.js 20+.

```bash
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local if your backend isn't on http://localhost:8001
npm run dev
```

App runs at http://localhost:3000. The backend must be running (see `../backend/README.md`
or `docker-compose up backend postgres redis` from the repo root) for any data to load.

## Running via Docker Compose

From the repository root:

```bash
cp frontend/.env.local.example frontend/.env.local
docker-compose up --build
```

The `frontend` service builds from `frontend/Dockerfile`, bind-mounts the source directory,
and runs `npm run dev` on port 3000 inside the container.

## Scripts

- `npm run dev` — start the dev server on port 3000
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — Next.js ESLint
- `npm run typecheck` — `tsc --noEmit`

## Project structure

```
frontend/
├── app/                     # App Router pages
│   ├── page.tsx             # Home
│   ├── courses/             # Public catalog + detail
│   ├── login/, register/    # Auth
│   ├── student/             # Student dashboard, lessons, assignments, grades, notifications, profile, quizzes
│   ├── teacher/              # Teacher dashboard, course builder, assignments, submissions, quiz builder
│   └── admin/                 # Admin dashboard, users, courses, categories, settings
├── components/              # Shared UI (Nav, CourseCard, ProgressBar, NotificationBell, forms...)
├── lib/
│   ├── api.ts                # fetch wrapper + typed per-endpoint helpers
│   ├── types.ts              # Types mirroring API_SPEC.md entities
│   ├── AuthContext.tsx        # useAuth() — user/login/register/logout
│   └── useRequireAuth.ts     # Client-side route guard + role redirect
└── Dockerfile
```

## Auth model

- JWT from `/api/auth/login` / `/api/auth/register` is stored in `localStorage` and attached
  as `Authorization: Bearer <token>` to every authenticated request via `lib/api.ts`.
- `AuthContext` loads the current user from `/api/users/profile` on mount if a token exists.
- `useRequireAuth(roles?)` redirects to `/login` when unauthenticated, or to the user's own
  `/{role}` dashboard when the role doesn't match the page's allowed roles. This is a UX
  convenience only — the backend re-checks role/ownership on every request per the spec.

## Known deviations from `API_SPEC.md`

The original spec only documented create/mutate actions for a few resources and omitted some
"list" reads the required UI pages need. Per the spec's "Addendum: senior review findings
(2026-07-10)", six additional GET endpoints are now part of the contract and implemented by
the backend, matching the calls already in `lib/api.ts`:

- `GET /api/enrollments` — current student's enrollments (for "My Courses" + progress bars),
  each item embedding the full `course` object.
- `GET /api/assignments?courseId=` and `GET /api/assignments/mine` — list assignments.
- `GET /api/submissions?assignmentId=` and `GET /api/submissions/mine` — list submissions.
- `GET /api/quizzes?courseId=` — list a course's quizzes.

`POST /api/quizzes/:id/submit`'s body is implemented as
`{ answers: { questionId: number; answer: string }[] }` since the spec's literal
`{ questionId: string }[]` shape has no field for the actual selected answer (likely a
documentation typo). Update `quizzesApi.submit` if the backend expects something else.

## Session handling

`lib/api.ts`'s `request()` clears the stored token and hard-redirects to `/login` whenever an
authenticated call (`auth: true`, the default) comes back `401` — this covers expired/invalid
JWTs so a user isn't left staring at a stale per-page error forever. Calls made with
`auth: false` (`authApi.login`/`authApi.register`) are exempt, since a `401` there is a normal
"bad credentials" response, not a dead session.

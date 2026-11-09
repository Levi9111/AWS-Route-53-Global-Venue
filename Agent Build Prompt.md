## Context

Build **Global VenueFinder**, an "Airbnb for Event Spaces" marketplace. Two deliverables, in one monorepo: a Next.js frontend and an Express.js backend. MongoDB (Mongoose) is the database. Authentication is JWT-based. The backend will later run in Docker on AWS ECS across two regions (us-east-1, eu-west-1) behind a shared MongoDB instance — design the backend to be stateless so it works unmodified in that setup (no in-memory sessions, no local file storage, no server-local caches that must stay in sync across instances).

Scaffold the backend using the `create-express-modular` CLI (npm: `cem`) as the starting structure, then build on top of it.

---

## Tech stack & conventions

- **Backend:** Node.js, Express.js, Mongoose, TypeScript, JWT (`jsonwebtoken`), `bcrypt` for password hashing, `zod` or `joi` for request validation, `dotenv` for config.
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, a data-fetching layer (`fetch` or `axios` wrapped in a typed API client), React Hook Form + zod for forms.
- **Shared conventions:** ESLint + Prettier, consistent error-response shape `{ "error": { "code": string, "message": string } }`, all dates in ISO 8601 / UTC, all money amounts as integers in minor units (cents) to avoid floating-point bugs.
- Every list endpoint supports pagination (`?page=`, `?limit=`) and returns `{ data, page, limit, total }`.

---

## Backend requirements

### Data models (Mongoose)

- **User:** name, email (unique), passwordHash, role (`renter` | `host` | `admin`), createdAt.
- **Venue:** hostId (ref User), title, description, address, city, country, lat/lng, capacity, pricePerHour (cents), amenities (string\[\]), photos (string\[\] URLs), instantBook (boolean), createdAt.
- **Booking:** venueId (ref Venue), renterId (ref User), startTime, endTime, status (`pending` | `confirmed` | `cancelled` | `completed`), totalPrice (cents), createdAt.
- **Review:** bookingId (ref Booking), authorId (ref User), venueId (ref Venue), rating (1-5), comment, createdAt.

### Auth

- `POST /api/auth/register`, `POST /api/auth/login` (returns JWT access token), `POST /api/auth/refresh` if using refresh tokens, `GET /api/auth/me`.
- Middleware: `requireAuth`, `requireRole(role)`.
- Passwords hashed with bcrypt (cost factor 12). Never return passwordHash in any response.

### Core API routes

- `GET /api/venues` — search/filter by city, date range (checks against existing bookings), capacity, price range, amenities; paginated.
- `GET /api/venues/:id`
- `POST /api/venues` (host only)
- `PATCH /api/venues/:id` (host, own venue only)
- `DELETE /api/venues/:id` (host, own venue only)
- `POST /api/bookings` — must re-check venue availability server-side before confirming (prevent double-booking race conditions — use a MongoDB transaction or a unique compound index on venueId+timeslot).
- `GET /api/bookings/mine` (renter) and `GET /api/bookings/venue/:venueId` (host)
- `PATCH /api/bookings/:id/cancel`
- `POST /api/reviews` (only after a completed booking)
- `GET /api/venues/:id/reviews`

### Cross-cutting

- `GET /health` — returns 200 only if the Mongo connection is actually alive (not just that the process is running); this is what Route 53's health check will poll.
- Centralized error-handling middleware; never leak stack traces in production responses.
- Rate limiting on `/api/auth/*` (e.g. `express-rate-limit`).
- Structured JSON logging (so it's usable in CloudWatch Logs later).
- CORS configured for the frontend's origin(s) only.

---

## Frontend requirements

### Pages

- `/` — landing/search page with map + list of venues, filters (city, date, capacity, price).
- `/venues/[id]` — venue detail: photo gallery, amenities, booking calendar widget, reviews.
- `/book/[venueId]` — booking flow (date/time picker → price summary → confirm).
- `/dashboard` (renter) — upcoming/past bookings.
- `/host/dashboard` — host's venues, bookings on each, basic stats.
- `/host/venues/new` and `/host/venues/[id]/edit` — venue create/edit form.
- `/login`, `/register`.

### Behavior

- Auth state in a React context or a small store (Zustand), JWT kept in an httpOnly cookie set by the backend (not localStorage) to reduce XSS risk.
- All data fetching through a single typed API client (one file per resource: `api/venues.ts`, `api/bookings.ts`, etc.) so the base URL is swapped per environment via `NEXT_PUBLIC_API_URL`.
- Loading and error states on every data-fetching page (skeletons, not blank screens).
- Form validation client-side (zod) mirroring the backend's validation rules.
- Responsive layout (mobile-first); venue cards and the booking calendar are the two components worth the most polish.

---

## Environment variables (both apps read these from `.env`, never hardcoded)

**Backend:** `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`, `NODE_ENV`. **Frontend:** `NEXT_PUBLIC_API_URL`.

---

## Docker

- Separate `Dockerfile` for backend and frontend, both multi-stage (build stage → slim runtime stage), both running as a non-root user.
- Backend image includes a `HEALTHCHECK` instruction hitting `/health`.
- Root `docker-compose.yml` for local dev: backend, frontend, and a `mongo` service with a named volume, networked together, `.env.example` files for both apps.

---

## Deliverables / acceptance criteria

1. `docker-compose up` brings up frontend + backend + Mongo locally with no manual steps beyond copying `.env.example` to `.env`.
2. A renter can register, search venues, book an available slot, and see it on their dashboard.
3. A host can register, list a venue, and see incoming bookings.
4. Double-booking the same venue/timeslot is rejected server-side, not just hidden client-side.
5. `/health` returns 503 if Mongo is unreachable and 200 otherwise.
6. No secrets committed to the repo; both `.env` files are gitignored with `.env.example` checked in.

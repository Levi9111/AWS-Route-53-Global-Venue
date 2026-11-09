# Global VenueFinder — Multi-Region Event Space Marketplace

An "Airbnb for Event Spaces" full-stack monorepo engineered for stateless multi-region deployment on **AWS ECS (`us-east-1` & `eu-west-1`)** behind **AWS Route 53** health checks and a shared MongoDB cluster.

---

## Repository Structure

```
.
├── route-53-backend/      # Express + TypeScript + Mongoose + Zod (scaffolded via CEM CLI)
├── route-53-frontend/     # Next.js (App Router) + TypeScript + Tailwind CSS + Zod
└── docker-compose.yml     # Local orchestration: frontend + backend + MongoDB with named volume
```

---

## Quick Start (Docker Compose)

1. Copy `.env.example` to `.env` in both apps:
   ```bash
   cp route-53-backend/.env.example route-53-backend/.env
   cp route-53-frontend/.env.example route-53-frontend/.env
   ```
2. Launch the full stack:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   - **Frontend Web App:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000/api`
   - **Route 53 Health Check Endpoint:** `http://localhost:5000/health`

### Pre-Seeded Demo Accounts

When the backend connects to an empty MongoDB database, it automatically seeds 6 global venues and two demo accounts:
- **Demo Renter:** `renter@venuefinder.global` / `Password123!`
- **Demo Host:** `host@venuefinder.global` / `Password123!`

---

## Key Architectural Highlights

- **Stateless Multi-Region Backend:** No in-memory sessions or local filesystem state. JWT authentication is delivered via `httpOnly` cookies (`accessToken` + `refreshToken`) and `Bearer` headers.
- **Route 53 Active Health Check (`GET /health`):** Verifies `mongoose.connection.readyState === 1` and executes an active `admin().ping()` against MongoDB, returning `200 OK` when healthy and `503 Service Unavailable` when MongoDB is unreachable.
- **Server-Side Double-Booking Prevention:** Combines a MongoDB partial unique index on active timeslots with pre-insert and post-insert atomic overlap verification (`status: { $in: ['pending', 'confirmed'] }`, `startTime < end`, `endTime > start`), rejecting conflicts with `409 CONFLICT`.
- **Minor-Unit Currency Precision:** All monetary values (`pricePerHour`, `totalPrice`) are stored and transmitted as integers in cents.
- **Standardized Error & Pagination Contracts:**
  - Errors return `{ "error": { "code": string, "message": string } }` without leaking stack traces in production.
  - Paginated endpoints accept `?page=&limit=` and return `{ data, page, limit, total }`.

# SilkStudy — Study Abroad Platform

> Trustworthy study-abroad opportunity discovery. Deterministic eligibility. Explainable matching. No black boxes.

[![CI](https://github.com/rnmm226/silkstudy/actions/workflows/ci.yml/badge.svg)](https://github.com/rnmm226/silkstudy/actions)

---

## What it does

SilkStudy helps students find, filter, and apply to international programs and scholarships.

| Feature | Description |
|---|---|
| **Catalog** | Verified opportunities with full funding breakdowns (tuition, living, accommodation, visa, stipend…) |
| **Search** | Structured filters + PostgreSQL full-text search. Strict — no silent relaxation of filters |
| **Eligibility** | Deterministic rule engine (PASS / FAIL / UNKNOWN). Missing data → UNKNOWN, never FAIL |
| **Matching** | Explainable fit scoring across 7 dimensions with confidence score |
| **Applications** | Track applications per cycle with status and deadline countdown |
| **Admin** | Catalog CRUD, audit log, user management, help request queue |

---

## Stack

```
Next.js 14 (App Router)   TypeScript        PostgreSQL 16
Prisma ORM                NextAuth v4        Zod validation
Tailwind CSS              bcryptjs           Docker Compose
```

---

## Getting started

### 1. Prerequisites

- Node.js 22+
- pnpm 9+
- Docker Desktop

### 2. Clone and install

```bash
git clone https://github.com/rnmm226/silkstudy.git
cd silkstudy
pnpm install
```

### 3. Environment variables

```bash
cp .env.example .env
# Edit .env — fill in NEXTAUTH_SECRET at minimum
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `GOOGLE_CLIENT_ID` | Optional — Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional — Google OAuth |

### 4. Start the database

```bash
docker compose up -d postgres
```

### 5. Run migrations and seed

```bash
pnpm db:deploy    # apply migrations
pnpm db:seed      # load demo data
```

### 6. Start dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo accounts** (dev only — any password):
- `student.complete@example.com` — full profile, eligible student
- `student.missing@example.com` — incomplete profile

---

## Project structure

```
app/                    Next.js App Router pages + API routes
  api/v1/               REST API endpoints
    me/                 Authenticated student endpoints
    admin/              Admin-only endpoints
    opportunities/      Public catalog endpoints
    search/             Search endpoint
    matches/            Eligibility evaluation
  admin/                Admin UI
  applications/         Student applications page
  matches/              Match results + detail
  opportunities/        Opportunity detail
  search/               Search UI
  auth/                 Login / register / error pages
  dashboard/            Student dashboard
  profile/              Student profile editor

src/
  infrastructure/
    database/           Prisma client singleton
  modules/
    auth/               NextAuth config + session + authorization guards
    students/           Profile, academic records, preferences, budget
    catalog/            Opportunities, universities, cycles, deadlines
    search/             Full-text + structured search service
    eligibility/        Deterministic rule engine
    matching/           Fit scoring + ranking
    applications/       Application CRUD
    documents/          Document metadata
    notifications/      Notification read/dismiss
    advisors/           Help requests
    admin/              Admin catalog service
  shared/               Errors, API helpers, audit log

prisma/
  schema.prisma         28 models with full @relation coverage
  migrations/           SQL migration history
  seed.ts               Demo dataset (6 opportunities, 2 students)
```

---

## API overview

```
# Public
GET  /api/v1/opportunities
GET  /api/v1/opportunities/:id
GET  /api/v1/opportunities/:id/cycles
GET  /api/v1/opportunities/:id/deadlines
GET  /api/v1/search

# Authenticated student
GET  PATCH /api/v1/me/profile
GET  POST  /api/v1/me/academic-records
GET  PUT   /api/v1/me/preferences
GET  PUT   /api/v1/me/budget
GET  POST  /api/v1/me/applications
GET  POST  /api/v1/me/documents
GET  PATCH /api/v1/me/notifications/:id
GET  POST  /api/v1/me/help
GET        /api/v1/me/matches
POST       /api/v1/me/matches/recompute
POST       /api/v1/matches/evaluate

# Admin only
GET  POST  PATCH /api/v1/admin/opportunities
GET  POST  PATCH /api/v1/admin/sources
POST             /api/v1/admin/opportunities/:id/verify
```

---

## Available scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint
pnpm test             # Vitest unit tests
pnpm db:generate      # Regenerate Prisma client
pnpm db:deploy        # Apply pending migrations
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Prisma Studio
```

---

## Architecture decisions

- **Modular monolith** — all business logic in `src/modules/`, reusable by any future adapter (mobile API, public API)
- **No ML/RAG at MVP** — eligibility is deterministic; matching is rule-based and explainable
- **Strict search** — coverage filters never relax silently (FULL+FULL ≠ FULL only)
- **UNKNOWN ≠ NO** — missing student data yields UNKNOWN eligibility, not automatic rejection
- **Audit everything** — all admin mutations write to `audit_log`

---

## License

MIT

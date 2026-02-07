# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A manufacturing workshop shift scheduling system built with Next.js 16, Prisma 7, and PostgreSQL. Workers browse and sign up for shifts at work stations; admins/supervisors create shifts (including recurring via RRULE) and manage stations and workers.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + typescript)

# Database (requires PostgreSQL running on localhost:5432)
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (prisma migrate dev)
npm run db:seed      # Seed demo data (clears existing data first)
```

## Architecture

### Tech Stack
- **Next.js 16** (App Router, React 19, Turbopack)
- **Prisma 7** with `@prisma/adapter-pg` (PostgreSQL driver adapter via `pg` Pool)
- **NextAuth v5** (beta) with credentials provider, JWT strategy
- **shadcn/ui** (new-york style, Radix primitives, Tailwind v4, lucide icons)
- **Zod** for API request validation, **react-hook-form** for forms
- **FullCalendar** for calendar views, **rrule** for recurring shift expansion
- **TanStack React Query** for client-side data fetching

### Route Groups & Layouts
- `(auth)` — centered layout for `/login`, no sidebar
- `(dashboard)` — sidebar layout, requires auth session via `auth()` server call
  - `/dashboard` redirects: WORKER → `/dashboard/browse`, ADMIN/SUPERVISOR → `/dashboard/calendar`

### Role-Based Access (3 roles: ADMIN, SUPERVISOR, WORKER)
- **ADMIN/SUPERVISOR**: manage shifts, stations, workers; see calendar view
- **WORKER**: browse available shifts, sign up, view "My Shifts"
- API routes check `session.user.role` for write operations (ADMIN/SUPERVISOR only)
- Middleware checks for session cookie presence; detailed auth in API routes via `auth()`

### API Routes (`src/app/api/`)
All routes authenticate via `auth()` from `@/lib/auth`. Patterns:
- CRUD: `/api/shifts`, `/api/stations`, `/api/workers` (GET list, POST create)
- Individual: `/api/shifts/[id]`, `/api/stations/[id]`, `/api/workers/[id]` (GET, PUT, DELETE)
- Specialized: `/api/shifts/calendar` (calendar view), `/api/shifts/available` (worker browse), `/api/shifts/[id]/signups` (signup management), `/api/my-shifts`, `/api/recurring/expand`
- Dynamic route params use `{ params: Promise<{ id: string }> }` (Next.js 16 async params)

### Key Data Models (Prisma)
- `User` — has role, skills array, active flag; maps to `users` table
- `WorkStation` — has category, capacity, requiredSkills array, status enum; maps to `work_stations`
- `Shift` — belongs to WorkStation, has optional recurrence (RRULE string + recurrenceEnd), self-relation via parentShiftId for recurring instances; maps to `shifts`
- `ShiftSignup` — join between Shift and User with status enum, optional occurrenceDate for recurring shift signups; unique on [shiftId, userId, occurrenceDate]
- `ShiftException` — tracks cancelled/modified occurrences of recurring shifts

### Prisma Setup
- Uses **pg driver adapter** (`@prisma/adapter-pg` with `Pool`) — not the default Prisma engine
- Singleton pattern in `src/lib/prisma.ts` with global cache for dev hot reload
- Generated client output goes to `src/generated/prisma` (gitignored)
- Config in `prisma.config.ts`, schema in `prisma/schema.prisma`

### Recurrence System (`src/lib/recurrence.ts`)
- `getOccurrencesInRange()` expands stored RRULE into concrete dates for a time window
- `buildRRule()` creates RRULE strings from a `RecurrenceConfig` object
- `previewOccurrences()` generates preview before creating a recurring shift

### Path Aliases
`@/*` maps to `./src/*` (configured in tsconfig.json)

### Component Organization
- `src/components/ui/` — shadcn/ui primitives (do not manually edit; use `npx shadcn add <component>`)
- `src/components/layout/` — app-sidebar with role-based nav filtering
- `src/components/{shifts,stations,workers,calendar}/` — feature components (tables, forms, calendar views)

### Seed Credentials
- Admin: `admin@example.com` / `admin123`
- Supervisor: `supervisor@example.com` / `supervisor123`
- Worker: `worker@example.com` / `worker123`

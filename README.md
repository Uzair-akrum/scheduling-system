# Scheduling Showcase

A Next.js + Prisma scheduling app configured for showcase deployment on Vercel.

## Stack

- Next.js App Router + TypeScript
- Prisma 7 + SQLite (`better-sqlite3` adapter)
- NextAuth credentials login (JWT sessions)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client and migrate SQLite:

```bash
npm run db:generate
npm run db:migrate
```

3. Seed demo data:

```bash
npm run db:seed
```

4. Start dev server:

```bash
npm run dev
```

## Demo Credentials

- Admin: `admin@example.com` / `admin123`
- Supervisor: `supervisor@example.com` / `supervisor123`
- Worker: `worker@example.com` / `worker123`

## Showcase Mode (Vercel)

Use these env vars on Vercel:

- `DATABASE_URL=file:./prisma/dev.db` (or `file:./prisma/demo.db`)
- `SHOWCASE_MODE=true`
- `NEXT_PUBLIC_SHOWCASE_MODE=true`
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

Behavior in showcase mode:

- API write routes (`POST`/`PUT`/`DELETE`) return success but do not persist DB changes.
- UI still shows writes (create/edit/delete/signup/cancel) via in-memory per-tab state.
- All fake writes reset on refresh.

## DB Scripts

- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:generate`
- `npm run db:reset:sqlite`
- `npm run db:demo:build`

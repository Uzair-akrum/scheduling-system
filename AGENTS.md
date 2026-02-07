# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project with TypeScript and Prisma.

- `src/app`: routes, layouts, and API handlers (`src/app/api/**/route.ts`).
- `src/components`: UI and feature components (`ui`, `calendar`, `shifts`, `stations`, `workers`, `layout`).
- `src/lib`: shared helpers (auth, Prisma client, recurrence, utilities).
- `src/hooks`: reusable React hooks.
- `prisma`: schema, migrations, and seed script.
- `public`: static assets.

Use the `@/*` import alias for code under `src` (configured in `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run build`: create production build.
- `npm run start`: run the production server locally.
- `npm run lint`: run ESLint (`eslint-config-next` + TypeScript rules).
- `npm run db:generate`: regenerate Prisma client after schema changes.
- `npm run db:migrate`: create/apply a development migration.
- `npm run db:seed`: seed local database with demo users, stations, and shifts.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`).
- Indentation: 2 spaces; prefer double quotes and trailing semicolons to match existing files.
- Components/types: `PascalCase`; functions/variables: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- File names: kebab-case for component modules (example: `shift-detail-popover.tsx`).
- Keep API route files in `route.ts` within resource folders (example: `src/app/api/shifts/route.ts`).

## Testing Guidelines
There is currently no dedicated test runner configured. For now:
- Run `npm run lint` before every PR.
- Manually verify affected flows in UI and API routes.
- For data-related changes, run `npm run db:migrate && npm run db:seed` and re-test key scheduling paths.

If you add automated tests, colocate as `*.test.ts`/`*.test.tsx` near the feature and document the command in `package.json`.

## Commit & Pull Request Guidelines
Git history is minimal (bootstrap commit), so follow a clear, consistent style:
- Use short, imperative commit subjects (example: `Add recurring shift expansion endpoint`).
- Keep commits focused by concern (schema, API, UI, etc.).

PRs should include:
- What changed and why.
- Any migration/environment impacts.
- Screenshots or short recordings for UI changes.
- Linked issue/ticket when applicable.

## Security & Configuration Tips
- Never commit secrets; keep credentials in `.env`.
- Required local env vars include `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
- Rotate seeded/default credentials outside local development.

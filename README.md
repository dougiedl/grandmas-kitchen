# Grandma's Kitchen

Grandma's Kitchen is a nostalgia-first cooking app that turns ingredients, cravings, and family food memories into practical grandma-inspired recipes.

## Sprint 1 Scope

Sprint 1 establishes foundation and delivery infrastructure for a fast beta build.

### Decisions locked

- Timeline: 12-week plan with accelerated 8-10 week feature-complete target.
- Auth: Google OAuth only (MVP).
- Launch cuisines: Italian, Mexican, Greek, Spanish.
- Beta size: 50-100 users.
- Positioning: Grandma-inspired, comfort and cultural continuity.

## Immediate Deliverables

- Repository structure and conventions.
- Local development setup.
- CI checks (lint, typecheck, tests).
- Initial PostgreSQL schema + migration workflow.
- Google OAuth authentication flow (scaffold + smoke test).
- Basic app shell and health endpoint.

## Proposed Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind.
- Backend: Next.js API routes (initial) with service extraction path.
- DB: PostgreSQL + pgvector.
- Cache/queue: Redis (introduced as needed, scaffolded in config).
- Auth: NextAuth with Google provider.
- Observability: Sentry + structured logs.

## Local Setup (target commands)

```bash
# 1) Install dependencies
npm install

# 2) Start local infra (postgres)
docker compose up -d postgres

# 3) Configure environment
cp .env.example .env.local

# 4) Run migrations
npm run db:migrate

# 5) Seed persona data
npm run db:seed

# 6) Start app
npm run dev
```

## Sprint 1 Exit Criteria

- New user can sign in via Google OAuth and reach app shell.
- Health check endpoint returns success.
- DB migrations run cleanly in local and CI.
- CI is green on pull requests.

## Reference Docs

- docs/REPO_BLUEPRINT.md
- docs/SPRINT_1_BACKLOG.md
- docs/SPRINT1_QA_CHECKLIST.md
- docs/SPRINT_1_STATUS.md

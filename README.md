# Grandma's Kitchen

Grandma's Kitchen is a nostalgia-first cooking app that turns ingredients, cravings, and family food memories into practical grandma-inspired recipes.

## Sprint 1 Scope

Sprint 1 establishes foundation and delivery infrastructure for a fast beta build.

### Decisions locked

- Timeline: 12-week plan with accelerated 8-10 week feature-complete target.
- Auth: Google OAuth only (MVP).
- Launch cuisines: Italian, Mexican, Greek, Spanish.
- Expansion set (enabled): French, Lebanese, Persian.
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

# Optional: enable real model generation instead of mock fallback
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-4.1-mini
# OPENAI_EMBED_MODEL=text-embedding-3-small
# Optional: admin dashboard allowlist
# ADMIN_EMAILS=you@example.com,teammate@example.com

# 4) Run migrations
npm run db:migrate

# 5) Seed persona data
npm run db:seed

# 6) Start app
npm run dev

# 7) Optional API smoke checks (run in separate terminal while app is running)
npm run qa:smoke
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
- docs/SPRINT_2A_KNOWLEDGE_LAYER.md

## Personalization (Current)

- The chat layer now detects regional cuisine cues (for example: Sicilian, Neapolitan, Italian-American New York).
- Signals are stored per user and reused on future recipe generations.
- `/profile` shows current taste memory snapshot and top learned regional signals.

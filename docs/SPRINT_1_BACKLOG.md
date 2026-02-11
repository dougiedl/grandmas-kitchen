# Sprint 1 Backlog (2 weeks)

Sprint goal: establish a production-grade foundation so feature work can proceed at high speed.

## Capacity Assumption

- 1 full-stack engineer
- 10 working days
- ~45 focused engineering hours/week

## Tickets (Linear/Jira Ready)

### GK-001 Project bootstrap

- Priority: P0
- Estimate: 5 points
- Description: Initialize Next.js + TypeScript + Tailwind project in `apps/web` and set base scripts.
- Acceptance criteria:
  - `npm run dev` starts app.
  - `npm run lint` and `npm run typecheck` pass.
  - App renders base shell with `Grandma's Kitchen` header.

### GK-002 Monorepo and package boundaries

- Priority: P1
- Estimate: 3 points
- Description: Create `packages/shared`, `packages/ui`, `packages/config` and wire workspace tooling.
- Acceptance criteria:
  - Workspace install succeeds from repo root.
  - Web app imports shared package without path hacks.

### GK-003 CI workflow

- Priority: P0
- Estimate: 3 points
- Description: Add GitHub Actions pipeline for lint, typecheck, test.
- Acceptance criteria:
  - CI triggers on PR and main pushes.
  - Build fails on lint/type errors.

### GK-004 Local infra and environment config

- Priority: P0
- Estimate: 2 points
- Description: Add `.env.example` and `docker-compose.yml` (Postgres service).
- Acceptance criteria:
  - Developer can start postgres locally in one command.
  - Required env vars documented in README.

### GK-005 Database schema v1

- Priority: P0
- Estimate: 5 points
- Description: Create base schema for users, profiles, personas, threads, messages, recipes.
- Acceptance criteria:
  - Migration applies successfully.
  - Tables enforce FK constraints.
  - Indexes exist on thread and recipe lookup paths.

### GK-006 DB migration workflow

- Priority: P1
- Estimate: 2 points
- Description: Add migration scripts and CI validation step.
- Acceptance criteria:
  - `npm run db:migrate` works locally.
  - CI can run migration validation without manual steps.

### GK-007 Google OAuth integration

- Priority: P0
- Estimate: 5 points
- Description: Configure NextAuth with Google provider and protected route middleware.
- Acceptance criteria:
  - User can sign in with Google in local environment.
  - Protected page redirects unauthenticated users.
  - Session includes stable user id/email.

### GK-008 App shell and navigation scaffold

- Priority: P1
- Estimate: 3 points
- Description: Build minimal shell with top nav and placeholder routes (`/`, `/chat`, `/profile`, `/recipes`).
- Acceptance criteria:
  - All routes load with no runtime errors.
  - Active navigation state visible.

### GK-009 Health endpoint and readiness probe

- Priority: P1
- Estimate: 2 points
- Description: Implement `/api/health` returning status and timestamp.
- Acceptance criteria:
  - Returns `200` with JSON payload.
  - Can be used by hosting readiness checks.

### GK-010 Logging and error boundary baseline

- Priority: P1
- Estimate: 3 points
- Description: Add request-id logging middleware and frontend error boundary.
- Acceptance criteria:
  - Server logs include request id for API calls.
  - UI handles unhandled component errors gracefully.

### GK-011 Seed launch cuisine personas

- Priority: P1
- Estimate: 2 points
- Description: Seed persona metadata for Italian, Mexican, Greek, Spanish.
- Acceptance criteria:
  - Persona table contains 4 active rows.
  - Landing page can list personas from DB or static adapter.

### GK-012 Sprint 1 QA checklist and handoff

- Priority: P0
- Estimate: 2 points
- Description: Create verification checklist and run smoke tests.
- Acceptance criteria:
  - Documented smoke run includes auth, migrations, CI, health endpoint.
  - All P0 tickets accepted or explicitly deferred.

## Suggested Execution Order

1. GK-001
2. GK-002
3. GK-003
4. GK-004
5. GK-005
6. GK-006
7. GK-007
8. GK-008
9. GK-009
10. GK-010
11. GK-011
12. GK-012

## Sprint 1 Definition of Done

- P0 tickets complete.
- No open P0 defects.
- CI green on main.
- New developer setup time under 30 minutes.
- Auth and DB baseline proven with smoke test evidence.

# Sprint 1 QA Checklist

Run this checklist before marking Sprint 1 complete.

## Environment Setup

1. `cp .env.example .env.local`
2. Fill `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`/`AUTH_SECRET`.
3. `docker compose up -d postgres`
4. `npm install`
5. `npm run db:migrate`
6. `npm run db:seed`

## Smoke Tests

1. App boot:
- Command: `npm run dev`
- Expectation: app loads at `http://localhost:3000` without runtime crash.

2. Health endpoint:
- Command: `curl -s http://localhost:3000/api/health`
- Expectation: `status=ok` and ISO `timestamp`.

3. Protected route redirect:
- Command: open `/chat` while signed out.
- Expectation: redirect to `/` with `signin=1` query.

4. Google sign-in:
- Command: use `Sign in with Google` link.
- Expectation: successful login and user email visible in header.

5. Active navigation:
- Command: visit `/`, `/chat`, `/profile`, `/recipes`.
- Expectation: current route link is highlighted and has `aria-current=page`.

6. Persona render:
- Command: open `/`.
- Expectation: 4 launch personas are visible (Italian, Mexican, Greek, Spanish).

7. Migration + seed idempotency:
- Commands:
  - `npm run db:migrate`
  - `npm run db:seed`
- Expectation: reruns succeed without errors.

8. CI parity (local):
- Commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
- Expectation: all pass.

## Handoff Notes

- If any check fails, capture exact command, output, and timestamp before handoff.
- P0 issues block Sprint 1 completion.

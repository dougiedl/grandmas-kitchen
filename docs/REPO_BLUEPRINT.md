# Repo Blueprint (Sprint 1)

## Structure

```text
.
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (marketing)/
│       │   │   ├── chat/
│       │   │   ├── api/
│       │   │   │   ├── health/route.ts
│       │   │   │   └── auth/[...nextauth]/route.ts
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   ├── lib/
│       │   │   ├── auth/
│       │   │   ├── db/
│       │   │   └── telemetry/
│       │   └── styles/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── config/
│   ├── ui/
│   └── shared/
├── db/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docs/
│   ├── REPO_BLUEPRINT.md
│   └── SPRINT_1_BACKLOG.md
├── .github/
│   └── workflows/ci.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

## Conventions

- Language: TypeScript throughout application code.
- Path aliases: `@/` for app-local, `@gk/shared` for cross-package shared code.
- API contracts: zod schemas in `packages/shared/contracts`.
- DB access: repository layer under `apps/web/src/lib/db`.
- Feature flags: `apps/web/src/lib/flags.ts`.

## Initial Domain Modules

- `auth`: session/user identity via Google OAuth.
- `profile`: dietary flags, allergens, spice tolerance.
- `personas`: grandma persona metadata for launch cuisines.
- `chat`: thread + message persistence.
- `recipes`: generated recipe storage.

## Environment Variables (Sprint 1)

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SENTRY_DSN` (optional in Sprint 1)

## CI Pipeline (minimum)

1. Install dependencies.
2. Typecheck.
3. Lint.
4. Unit tests.
5. Migration validation (schema up/down smoke if supported).

## Branching and Release

- Main branch protected.
- Feature branches: `codex/<ticket-id>-<short-name>`.
- Merge strategy: squash.
- Tag staging deploys: `staging-YYYYMMDD-N`.

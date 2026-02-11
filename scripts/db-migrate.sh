#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but not installed"
  exit 1
fi

for migration in db/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Applying $migration"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  fi
done

echo "Migrations applied successfully."

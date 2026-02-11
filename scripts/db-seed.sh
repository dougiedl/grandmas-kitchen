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

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seeds/personas.sql

echo "Seed data applied successfully."

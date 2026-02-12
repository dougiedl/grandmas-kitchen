#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

run_sql_file() {
  local sql_file="$1"

  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$sql_file"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    docker compose exec -T postgres psql -U postgres -d grandmas_kitchen -v ON_ERROR_STOP=1 -f - < "$sql_file"
    return
  fi

  echo "psql is not installed and Docker is unavailable. Install one of them to run migrations."
  exit 1
}

for migration in db/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Applying $migration"
    run_sql_file "$migration"
  fi
done

echo "Migrations applied successfully."

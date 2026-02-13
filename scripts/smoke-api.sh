#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "[smoke] Checking health endpoint"
HEALTH_CODE=$(curl -s -o /tmp/gk_health.json -w "%{http_code}" "$BASE_URL/api/health")
if [[ "$HEALTH_CODE" != "200" ]]; then
  echo "[smoke] FAIL /api/health expected 200 got $HEALTH_CODE"
  exit 1
fi

echo "[smoke] Checking protected chat start without auth"
CHAT_START_CODE=$(curl -s -o /tmp/gk_chat_start.json -w "%{http_code}" -X POST "$BASE_URL/api/chat/start" -H 'Content-Type: application/json' -d '{"personaId":"nonna-rosa"}')
if [[ "$CHAT_START_CODE" != "401" ]]; then
  echo "[smoke] FAIL /api/chat/start expected 401 when unauthenticated got $CHAT_START_CODE"
  exit 1
fi

echo "[smoke] Checking analytics track without auth"
ANALYTICS_CODE=$(curl -s -o /tmp/gk_analytics.json -w "%{http_code}" -X POST "$BASE_URL/api/analytics/track" -H 'Content-Type: application/json' -d '{"eventName":"smoke_test"}')
if [[ "$ANALYTICS_CODE" != "401" ]]; then
  echo "[smoke] FAIL /api/analytics/track expected 401 when unauthenticated got $ANALYTICS_CODE"
  exit 1
fi

echo "[smoke] Checking discovery trending without auth"
DISCOVERY_CODE=$(curl -s -o /tmp/gk_discovery.json -w "%{http_code}" "$BASE_URL/api/discovery/trending")
if [[ "$DISCOVERY_CODE" != "401" ]]; then
  echo "[smoke] FAIL /api/discovery/trending expected 401 when unauthenticated got $DISCOVERY_CODE"
  exit 1
fi

echo "[smoke] PASS"

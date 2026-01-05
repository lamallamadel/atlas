#!/usr/bin/env sh
set -eu

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8081}"
REALM="${KEYCLOAK_REALM:-myrealm}"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-atlas-frontend}"
USERNAME="${KEYCLOAK_USERNAME:-demo}"
PASSWORD="${KEYCLOAK_PASSWORD:-demo}"

TOKEN_ENDPOINT="$KEYCLOAK_BASE_URL/realms/$REALM/protocol/openid-connect/token"

curl -fsS -X POST "$TOKEN_ENDPOINT" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=$CLIENT_ID" \
  -d 'grant_type=password' \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD" \
  | (command -v jq >/dev/null 2>&1 && jq -r '.access_token' || cat)

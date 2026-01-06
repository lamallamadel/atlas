#!/usr/bin/env bash
set -euo pipefail

# Runs Playwright E2E against a locally started backend using the Spring 'e2e' profile.
# - No Keycloak required: backend uses issuer-uri=mock.
# - Frontend uses Playwright fast config which injects a mock token via storageState.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"

echo "Starting backend (profile=e2e) on port ${BACKEND_PORT}..."
(
  cd "${ROOT_DIR}/backend"
  if [[ -x "./mvnw" ]]; then
    MVN_CMD=("./mvnw")
  else
    MVN_CMD=("mvn")
  fi

  SPRING_PROFILES_ACTIVE=e2e SERVER_PORT="${BACKEND_PORT}" "${MVN_CMD[@]}" -q spring-boot:run
) &
BACKEND_PID=$!

cleanup() {
  echo "Stopping backend (pid=${BACKEND_PID})..."
  kill "${BACKEND_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for backend health..."
for i in {1..60}; do
  if curl -fsS "http://localhost:${BACKEND_PORT}/actuator/health" >/dev/null; then
    echo "Backend is up."
    break
  fi
  sleep 1
done

if ! curl -fsS "http://localhost:${BACKEND_PORT}/actuator/health" >/dev/null; then
  echo "Backend did not become healthy in time." >&2
  exit 1
fi

echo "Running Playwright E2E (fast) against frontend on port ${FRONTEND_PORT}..."
(
  cd "${ROOT_DIR}/frontend"
  PLAYWRIGHT_BASE_URL="http://localhost:${FRONTEND_PORT}" npm run e2e:fast
)

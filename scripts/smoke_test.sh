#!/usr/bin/env bash
#
# smoke_test.sh -- confirm the Harrier server is up and returns sane vectors.
#
# Checks:
#   1. /health returns status ok
#   2. /api/embeddings returns a single embedding vector
#   3. /api/embed returns a batch of embedding vectors
#   4. vector dimensionality is > 0 and consistent
#
# Exit non-zero on any failure. Usage: scripts/smoke_test.sh [endpoint]

set -euo pipefail

ENDPOINT="${1:-${HARRIER_ENDPOINT:-http://127.0.0.1:18840}}"
echo "==> Harrier smoke test against ${ENDPOINT}"

echo "--> GET /health"
HEALTH="$(curl -fsS --retry 3 --retry-all-errors "${ENDPOINT}/health")"
echo "    ${HEALTH}"
echo "${HEALTH}" | grep -q '"status": "ok"' || { echo "FAIL: health not ok"; exit 1; }

echo "--> POST /api/embeddings (single)"
SINGLE="$(curl -fsS --retry 3 --retry-all-errors "${ENDPOINT}/api/embeddings" \
  -H 'Content-Type: application/json' \
  -d '{"model":"harrier","prompt":"the quick brown fox"}')"
DIMS="$(printf '%s' "${SINGLE}" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["embedding"]))')"
echo "    embedding dims: ${DIMS}"
[ "${DIMS}" -gt 0 ] || { echo "FAIL: empty embedding"; exit 1; }

echo "--> POST /api/embed (batch of 2)"
BATCH="$(curl -fsS --retry 3 --retry-all-errors "${ENDPOINT}/api/embed" \
  -H 'Content-Type: application/json' \
  -d '{"model":"harrier","input":["alpha","beta"]}')"
NVEC="$(printf '%s' "${BATCH}" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["embeddings"]))')"
BDIMS="$(printf '%s' "${BATCH}" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["embeddings"][0]))')"
echo "    vectors: ${NVEC}, dims: ${BDIMS}"
[ "${NVEC}" -eq 2 ] || { echo "FAIL: expected 2 vectors"; exit 1; }
[ "${BDIMS}" -eq "${DIMS}" ] || { echo "FAIL: dim mismatch single=${DIMS} batch=${BDIMS}"; exit 1; }

echo "==> PASS: server healthy, ${DIMS}-d embeddings, batch shape correct"

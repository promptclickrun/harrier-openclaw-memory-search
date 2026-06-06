#!/usr/bin/env bash
#
# run_server.sh -- convenience launcher for local development.
#
# Honors the same HARRIER_* env vars as server/harrier_server.py.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "${HERE}/server/harrier_server.py"

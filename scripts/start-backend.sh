#!/usr/bin/env bash
# ============================================================
# start-backend.sh  –  Start the Node.js relay backend
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "==> Installing Node.js dependencies..."
cd "$BACKEND_DIR"
npm install --silent

echo ""
echo "==> Configuration"
echo "    PORT             : ${PORT:-3001}"
echo "    AUTH enabled     : ${BACKEND_AUTH_TOKEN:+yes}${BACKEND_AUTH_TOKEN:-no (set BACKEND_AUTH_TOKEN to enable)}"
echo "    ALLOWED_ORIGINS  : ${ALLOWED_ORIGINS:-http://localhost:3000}"
echo ""

npm start

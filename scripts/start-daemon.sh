#!/usr/bin/env bash
# ============================================================
# start-daemon.sh  –  Start the CLI Daemon on this machine
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON_DIR="$SCRIPT_DIR/../cli-daemon"

echo "==> Installing Python dependencies..."
pip install -r "$DAEMON_DIR/requirements.txt" --quiet

echo ""
echo "==> Configuration"
echo "    MACHINE_NAME    : ${MACHINE_NAME:-$(hostname)}"
echo "    PORT            : ${PORT:-5001}"
echo "    AUTH enabled    : ${DAEMON_AUTH_TOKEN:+yes}${DAEMON_AUTH_TOKEN:-no (set DAEMON_AUTH_TOKEN to enable)}"
echo ""

cd "$DAEMON_DIR"
python app.py

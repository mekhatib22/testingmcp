#!/usr/bin/env bash
# ============================================================
# deploy-frontend.sh  –  Build and deploy the React frontend
#                        to Vercel (requires `vercel` CLI)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

echo "==> Installing dependencies..."
cd "$FRONTEND_DIR"
npm install --silent

echo "==> Building..."
npm run build

echo "==> Deploying to Vercel..."
if ! command -v vercel &>/dev/null; then
  echo "vercel CLI not found. Installing globally..."
  npm install -g vercel
fi

vercel --prod "${VERCEL_ARGS:-}"

echo "==> Done! Set VITE_BACKEND_URL in your Vercel project environment variables."

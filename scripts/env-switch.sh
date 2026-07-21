#!/bin/bash
# Switch between local dev and production API environments.
# Usage: ./scripts/env-switch.sh local|prod
#
# After switching, restart Metro: npx expo start --clear

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

case "$1" in
  local|dev)
    cp "$PROJECT_DIR/.env.dev" "$PROJECT_DIR/.env.local"
    echo "✓ Switched to LOCAL (dev Clerk + localhost:4000)"
    echo "  Note: Physical iPad can't reach localhost — use simulator or update URL"
    ;;
  prod|production)
    cp "$PROJECT_DIR/.env.prod" "$PROJECT_DIR/.env.local"
    echo "✓ Switched to PROD (live Clerk + bentspline.com)"
    ;;
  status)
    if grep -q "bentspline.com" "$PROJECT_DIR/.env.local" 2>/dev/null; then
      echo "Currently: PROD"
    elif grep -q "localhost" "$PROJECT_DIR/.env.local" 2>/dev/null; then
      echo "Currently: LOCAL"
    else
      echo "Currently: UNKNOWN (check .env.local)"
    fi
    exit 0
    ;;
  *)
    echo "Usage: $0 <local|prod|status>"
    echo ""
    echo "  local   — dev Clerk + http://lunettiq.localhost:4000"
    echo "  prod    — live Clerk + https://lunettiq.bentspline.com"
    echo "  status  — show current environment"
    exit 1
    ;;
esac

echo ""
echo "→ Restart Metro to apply: npx expo start --clear"

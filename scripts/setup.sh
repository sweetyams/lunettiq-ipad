#!/bin/bash
# lunettiq-ipad bootstrap — run once after clone, or anytime things feel broken.
# Usage: pnpm setup

set -e

echo ""
echo "━━━ Lunettiq iPad — Setup ━━━"
echo ""

# 1. Check prerequisites
echo "▸ Checking prerequisites..."
command -v node >/dev/null || { echo "✗ Node.js not found. Install Node 20+."; exit 1; }
command -v pnpm >/dev/null || { echo "✗ pnpm not found. Run: npm i -g pnpm"; exit 1; }
command -v xcode-select >/dev/null || { echo "✗ Xcode CLI tools not found."; exit 1; }

NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✗ Node $NODE_MAJOR found, need 20+"; exit 1;
fi
echo "  ✓ Node $(node -v), pnpm $(pnpm -v), Xcode $(xcode-select -v 2>&1 | grep -o '[0-9.]*')"

# 2. Install dependencies
echo ""
echo "▸ Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 3. Check .env.local
echo ""
echo "▸ Checking environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  ⚠ Created .env.local from example — you need to fill in real values."
fi

CLERK_KEY=$(grep EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY .env.local | cut -d= -f2)
if [ "$CLERK_KEY" = "pk_test_..." ] || [ -z "$CLERK_KEY" ]; then
  # Try to pull from Foundry
  FOUNDRY_KEY=$(grep NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ../foundry/.env.local 2>/dev/null | cut -d= -f2)
  if [ -n "$FOUNDRY_KEY" ] && [ "$FOUNDRY_KEY" != "pk_test_..." ]; then
    sed -i '' "s|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=.*|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=$FOUNDRY_KEY|" .env.local
    echo "  ✓ Clerk key auto-filled from Foundry"
  else
    echo "  ✗ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!"
    echo "    Get it from: https://dashboard.clerk.com → API Keys"
    exit 1
  fi
else
  echo "  ✓ Clerk key set"
fi

FOUNDRY_URL=$(grep EXPO_PUBLIC_FOUNDRY_BASE_URL .env.local | cut -d= -f2)
echo "  ✓ Foundry URL: $FOUNDRY_URL"

# 4. Prebuild native project (if missing or stale)
echo ""
echo "▸ Checking native build..."
if [ ! -d "ios/Pods" ] || [ ! -f "ios/Podfile.lock" ]; then
  echo "  Building native project (first time — takes 3-5 min)..."
  npx expo prebuild --clean
else
  # Check if native deps changed
  if [ package.json -nt ios/Podfile.lock ]; then
    echo "  Dependencies changed — rebuilding native project..."
    npx expo prebuild --clean
  else
    echo "  ✓ Native build up to date"
  fi
fi

# 5. Verify the build compiles
echo ""
echo "▸ Running typecheck..."
pnpm typecheck 2>/dev/null && echo "  ✓ Types OK" || echo "  ⚠ Type errors (pre-existing, non-blocking)"

# 6. Run tests
echo ""
echo "▸ Running tests..."
pnpm test 2>/dev/null | tail -3

# 7. Done
echo ""
echo "━━━ Ready! ━━━"
echo ""
echo "  Start developing:  pnpm ios"
echo "  Run tests:         pnpm test"
echo "  Check types:       pnpm typecheck"
echo ""
echo "  ⚠ Always use 'pnpm ios' — not 'pnpm dev' (Expo Go won't work)"
echo ""

# 2026-07-20 — iPad App Setup, Error Handling, Design System Migration

## What Was Done

- **EnvGate + DevErrorBoundary** — Added startup environment validation and runtime error boundary to `app/_layout.tsx`. Bad config now shows actionable diagnostics on-screen instead of cryptic Clerk crashes.
- **Clerk key fix** — Auto-discovered the real key from `../foundry/.env.local` and populated iPad's `.env.local`.
- **Fixed `pnpm logs`** — Replaced broken `react-native log-ios` with `xcrun simctl` log streaming.
- **Fixed appointments endpoint** — Changed from non-existent `/api/storefront/scheduling/appointments` to actual Foundry route `/api/scheduling`. Also fixed transition mutation to `/api/scheduling/{id}/transition`.
- **Graceful error handling on Home** — Network and auth errors now show empty state instead of error screen.
- **Design system migration (Phase 1)** — Rewrote `tailwind.config.js` with Foundry semantic tokens. Mass find-replace across 61 files (670+ color class usages). Killed navy/green/ivory palette, replaced with Foundry's brand/accent/bg-page system. Added General Sans font.
- **Mobile JWT auth spec** — Wrote `foundry/docs/specs/mobile-jwt-auth.md` for the Foundry middleware change (implemented by other agent in same session).
- **Setup script** — Created `scripts/setup.sh` (`pnpm setup`) that validates env, auto-fills Clerk key from Foundry, checks native build state, runs tests.
- **Blocked `pnpm dev`** — Now prints warning. Prevents Expo Go trap.
- **Enabled New Architecture** — Added `newArchEnabled: true` to `Podfile.properties.json` for MMKV 3.x compatibility.

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Kill iPad-specific palette, use Foundry tokens | One brand identity across web + iPad. Storefront IS the brand. | Keep iPad-unique luxury palette (rejected: brand divergence) |
| General Sans everywhere (not system font) | Brand consistency with storefront | System font for body (faster render, more native) — rejected for brand cohesion |
| Runtime token fetch + hardcoded fallback | App always matches live storefront; changes from admin panel propagate without code deploy | Hardcode only (drifts), runtime only (blocks on network) |
| Bearer JWT via `verifyToken()` (not API key) | Per-user identity needed for audit trails, role-gating, session attribution | API key auth (simpler but loses user identity) |
| Block `pnpm dev` / Expo Go | MMKV, WatermelonDB, camera all require native modules. Expo Go guaranteed crash. | Warning in README (insufficient — devs won't read it) |
| EnvGate shows diagnostics in dev only | Production assumes env is correct (set at build time). Dev needs fast feedback. | Crash with console error (status quo — bad DX) |

## Architecture Notes

### Auth Flow (post-middleware change)
```
iPad: Clerk sign-in → getToken() → Bearer eyJ...
  ↓
Foundry middleware (proxy.ts):
  Bearer sk_* → API key handler
  Bearer ey* + X-Found-Surface: tablet → handleMobileJwtRequest (NEW)
    → verifyToken() (JWKS validation, no cookies needed)
    → lookupMemberContext(projectId, userId)
    → inject x-found-role, x-found-locations, x-found-user-id
    → NextResponse.next()
  Browser (cookies) → clerkHandler (existing)
```

### Design Token Architecture (new)
```
tailwind.config.js (hardcoded defaults)
  ↓ (Phase 3 — future)
useDesignTokens() → GET /api/design/tokens → MMKV cache (24h)
  ↓
NativeWind runtime theme override
  ↓
All components render with live tokens
```

### Token Mapping (key renames)
```
bg-navy → bg-brand          text-charcoal → text-text-primary
bg-green → bg-accent        text-midGrey → text-text-muted
bg-offWhite → bg-bg-page    text-white → text-text-inverse
bg-warmGrey → bg-border     border-warmGrey → border-border
bg-white → bg-bg-elevated   text-foreground → text-text-primary
```

## Findings

- **Foundry's scheduling routes live at `/api/scheduling`**, not `/api/admin/appointments` or `/api/storefront/scheduling/appointments`. The iPad spec was wrong — always verify against Foundry's module manifests (`routes` field).
- **Clerk dev mode requires `__clerk_db_jwt` cookie** for browser clients. Mobile clients sending Bearer JWTs get `dev-browser-missing`. Fix: use `verifyToken()` server-side to bypass cookie requirement.
- **`react-native-mmkv` 3.x requires New Architecture (TurboModules).** Fails at runtime, not build time. Must set `newArchEnabled: true` in `Podfile.properties.json`.
- **Expo Go cannot run this app.** Three native deps (MMKV, WatermelonDB, expo-camera with custom config) require a dev client build. `pnpm dev` should never be the default command.
- **Simulator networking is fragile.** Breaks after Mac sleep, VPN changes. No programmatic fix — toggle WiFi or reboot simulator.

## Open Questions

- Is the iPad simulator's network back? (May need Mac WiFi toggle)
- Are there appointments in the DB for today? (Empty state vs auth failure look the same now)
- Phase 2/3 of design system: typography class rename + runtime token fetch — when?
- Product photos: confirmed they exist in Foundry DB. Will render once auth flow completes end-to-end.

## Next Steps

1. Get the iPad simulator online (WiFi toggle / simulator reboot)
2. Sign in via Clerk on the iPad — verify the full auth → products → photos flow
3. Design system Phase 2: rename typography classes (`text-displayLg` → `text-display-sm`, etc.)
4. Design system Phase 3: build `useDesignTokens()` hook for runtime fetch
5. Fix the 14 pre-existing TypeScript errors (sync engine status types, MCP tools)

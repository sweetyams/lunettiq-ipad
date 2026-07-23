# 2026-07-23 — End Session Fix + Staff Quick-Switch Build

## What Was Done

### 1. Fixed End Session Errors
- **Root cause:** `POST /api/clients/{id}/tryon-sessions` requires `locationId` in body. iPad was sending `{ clientId }` only → 400 VALIDATION → server session never created → local placeholder `ses_xxx` used → endSession hit 404.
- **Fix:** Created `useStaffProfile` hook (reads locationId from Clerk `publicMetadata`), passed it to `createSession`, and added a guard in `useEndSession` that skips the API call for local-only session IDs.

### 2. Built Staff Quick-Switch Feature (Clover Model)
Full iPad implementation of the PIN-based staff switching feature. Server already built by Foundry team.

**New files (5):**
| File | Purpose |
|------|---------|
| `src/features/auth/useOperatorStore.ts` | Zustand + MMKV store holding activeOperator, deviceOwnerId, roster |
| `src/features/auth/QuickSwitchLockScreen.tsx` | Full lock screen: roster grid + PinPad + Face ID fallback |
| `src/features/auth/useStaffProfile.ts` | Reads staffId/locationId from Clerk publicMetadata |
| `src/ui/PinPad.tsx` | 4-digit numeric input with shake animation, lockout countdown |
| `src/api/useDeviceAuth.ts` | TanStack hooks: useStaffRoster, useVerifyPin, useSetPin |

**Modified files (5):**
| File | Change |
|------|--------|
| `src/api/client.ts` | `X-Found-Operator` header + 403 operator-revocation detection |
| `src/features/auth/AuthProvider.tsx` | Swapped biometric-only lock for QuickSwitchLockScreen |
| `src/features/auth/index.ts` | New exports |
| `src/ui/SessionBar.tsx` | Operator badge + switch button |
| `app/(app)/more/settings.tsx` | PIN setup section (enter + confirm + save) |

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| `X-Found-Operator` header (not token swap) | Server validates on every request; iPad stays a thin identity layer. No complex token management. | Multiple Clerk sessions (not supported by Clerk Expo), device-level JWT with embedded operator claim |
| PIN requires avatar selection first | Foundry built `verify-pin` with `staffId` param. Two staff can share same PIN without collision. Clearer UX. | Global unique PIN per project (our original spec) |
| `useStaffProfile` reads from Clerk publicMetadata | Data already there from staff invite flow. No extra API call at boot. | Fetch `/api/staff` and filter by Clerk userId; store in WatermelonDB DeviceConfig |
| Guard local session IDs in `useEndSession` | Graceful degradation when server session wasn't created (missing locationId, network error). | Hard fail + error toast; force user to retry |
| Lock screen clears operator (not signs out) | Switching users is fast (PIN); signing out is heavy (OAuth). Device session persists across switches. | Full sign-out on lock |

## Architecture / Design Notes

```
┌──────────────────────────────────────────────────────┐
│  iPad Device                                          │
│                                                       │
│  Clerk JWT (device owner) ─── persistent              │
│  useOperatorStore.activeOperator ─── per PIN entry    │
│                                                       │
│  API Client:                                          │
│    Authorization: Bearer <device_jwt>                 │
│    X-Found-Surface: tablet                            │
│    X-Found-Operator: <operator.clerkUserId>  (if ≠)  │
│                                                       │
└───────────────────────────────┬──────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────┐
│  Foundry API                                          │
│                                                       │
│  1. Bearer validates device session                   │
│  2. X-Found-Operator → lookup staff, check active     │
│  3. Operator's role used for permissions              │
│  4. Audit: staffId=operator, deviceUserId=bearer      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

State dimensions after this change:
- **A — Work Context:** IDLE / SESSION / FITTING (unchanged)
- **B — View Mode:** STAFF / CLIENT / HANDED (unchanged)
- **C — Operator Identity:** DEVICE_OWNER / SWITCHED_OPERATOR (new)

## Findings

1. **Foundry's `handleCreateTryOnSession` requires `locationId`** — not documented in the steering API contract (`#10-foundry-api`). The endpoint returns 400 VALIDATION without it. iPad was silently failing session creation since day one.

2. **Clerk publicMetadata is the cheapest identity source** — Foundry already stores `projects.{slug}.primary_location_id` and `location_ids` when a staff member is invited. No extra fetch needed.

3. **Foundry built a tighter contract than our spec** — `verify-pin` requires `staffId` (better), response is leaner (better), error responses include `remainingAttempts` and `lockedUntil` (better). Our open questions about offline PIN validation and session suspend were left to iPad discretion.

4. **`useOperatorStore.getState()` works in the API client** — Zustand stores are accessible outside React components via `getState()`. This is the pattern for injecting the operator header without hooks.

## Open Questions

- **Per-operator session suspend/resume** — not built yet. Currently, switching operators doesn't save/restore session state. Second operator starts fresh in IDLE. Need to decide: save to MMKV keyed by clerkUserId, or just end the session?
- **Offline PIN validation** — server-only for now. If WiFi drops, staff can't switch. Acceptable for V1?
- **Device owner PIN setup prompt** — should the device owner be prompted to set a PIN on first sign-in so they appear on other devices' rosters?

## Next Steps

1. Test end-to-end with Foundry dev server running (verify PIN flow + operator header)
2. Add per-operator session suspend/resume if product decides it's needed
3. Update `#10-foundry-api` steering with the device auth endpoints
4. Add tests for `useOperatorStore` transitions and `PinPad` component states

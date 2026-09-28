# Device-bound location — scope

**Goal:** A physical location (store branch) is a property of the **iPad device**, not the
logged-in user. iPad A lives at the Montreal store, iPad B at the Toronto store. Any staff
member can sign into either iPad, but the device stays pinned to its location until someone
explicitly changes the setting.

**Status:** scoping — needs decisions + a Foundry contract addition before building.

---

## Why this is needed (the current gap)

Today location is derived from the **user**, not the device:

- `useStaffProfile()` computes `locationId = activeProject.primaryLocationId ?? locationIds[0] ?? null`
  (`src/features/auth/useStaffProfile.ts:57`).
- That value flows into: session creation (`useCreateSession` → `locationId` in the POST
  body, `src/api/useSessions.ts:24`), the staff-roster/PIN lock
  (`useStaffRoster(locationId)` in `QuickSwitchLockScreen.tsx:39`), and today's appointments
  (`useTodayAppointments(locationId)`).
- Problem 1: `my-projects` currently returns **empty `locationIds`** for the user, so
  `locationId` is `null` → the picker shows "No locations" and session creation can fail.
- Problem 2: even if populated, it's the *user's* home location, which is wrong when the
  same user works at two branches on two different iPads. The device should decide.

There is already scaffolding we can build on:

- **`DeviceConfig` model** (`src/db/models/DeviceConfig.model.ts`) has a `location_id` field
  and an `updateLocation()` method — but it's initialised to `''` in `useInitialSync.ts:198`
  and **never set or read anywhere**. It's dormant.
- **`useLocations()`** (`src/api/useLocations.ts`) already fetches
  `GET /api/storefront/locations` → `Location[]` (id, name, address, hours, isActive).
- **`LocationPickerSheet`** (`src/features/client-profile/LocationPickerSheet.tsx`) is a
  working location-picker UI (titled "Select Home Location") — currently used for client
  home-location, reusable for device location.

So the pieces exist; they're just not wired into a device-level setting.

---

## The model

| Concept | Bound to | Stored | Set by |
|---|---|---|---|
| Identity | Person | Clerk session | Login |
| Store / tenant | Device | `useTenantStore` (MMKV) | Set/Change store |
| **Physical location** | **Device** | **`DeviceConfig.location_id` (SQLite) + MMKV mirror** | **Location setting (this feature)** |
| Operator | Person (per shift) | `useOperatorStore` | PIN quick-switch |

Precedence for the effective location:
1. **Device location** (`DeviceConfig.location_id`) — if set, always wins.
2. Fallback: user's `primaryLocationId` from `my-projects` (first-run before device is
   configured).
3. Null → prompt the user to set the device location (don't silently fail).

Location is **per store**: switching store should clear/re-prompt the device location,
because location IDs belong to a tenant. Store A's locations aren't valid in store B.

---

## iPad work

### 1. A device-location store (source of truth)
New `useDeviceLocationStore` (MMKV), or promote the dormant `DeviceConfig.location_id`.
Recommend a small MMKV store keyed by tenant slug: `{ [slug]: locationId }`, so each store's
location is remembered independently. Expose `useActiveLocationId()`.

- Persisted (survives relaunch — the device stays at its branch).
- Cleared for a slug when needed; re-prompted on first use.

### 2. Resolve effective location centrally
Add `useEffectiveLocationId()`:
```
deviceLocation(slug) ?? activeProject.primaryLocationId ?? activeProject.locationIds[0] ?? null
```
Route `useStaffProfile().locationId` and all consumers through this, so device location
overrides the user default everywhere at once:
- `useSessions` createSession body
- `useStaffRoster(locationId)` (PIN roster scoped to the branch)
- `useTodayAppointments(locationId)` / `useStaffSchedules`
- inventory/stock reads that take `locationId`

### 3. Location setting UI
- Add a **"Location"** row to the **Profile** tab (the reachable settings screen — NOT
  `more/index.tsx`, which is unreachable; see prior fix), next to the Store section.
- Reuse `LocationPickerSheet` (retitle "Set device location"). It already lists locations
  from `useLocations()`.
- On select → write to the device-location store for the active tenant.
- Show the current device location on the row.

### 4. First-run prompt
After selecting a store, if no device location is set for it and the store has locations,
prompt the picker before entering Home (or surface a non-blocking banner). Never let session
creation proceed with a null location silently.

### 5. Permission
Changing the device location should arguably be gated (a manager action), not something any
SA does mid-shift. Decision needed: gate behind a role/permission, or allow any operator?
Recommend gating behind a manager/owner role or a device-owner Face ID confirm — otherwise a
staffer could repoint the till's location.

---

## Foundry work (contract)

### A. `my-projects` should return the store's locations
Right now `locationIds` comes back empty. The iPad needs, per project:
```jsonc
{
  "slug": "lunettiq",
  // ...
  "locationIds": ["loc_mtl_01", "loc_tor_02"],   // the STORE's locations (not just the user's)
  "primaryLocationId": "loc_mtl_01"               // sensible default
}
```
Decision for Foundry: should `locationIds` be **the store's full location list** (so the
device can be pinned to any branch) or **the user's assigned locations**? For device-binding
we want the **store's full list** — the device picks its branch regardless of which user
logs in. This likely differs from the current per-member semantics; confirm.

Alternatively, the iPad already has `GET /api/storefront/locations` (`useLocations`) which
returns the full active location list for the tenant. **If that endpoint is authoritative
for "all branches of this store," the iPad can use it directly and Foundry needs no
`my-projects` change** — we just need to confirm it returns all branches for the active
tenant and is available on each store host. This is the lighter path.

### B. Do writes need the location, and how?
Confirm how Foundry wants location on writes:
- Session create already sends `locationId` in the body — keep.
- Is there an `X-Found-Location` header convention, or is body/query param the norm? (The
  app currently uses query param for reads, body for session create.) Standardise.
- Should audit attribute the **device location** on every write (so a sale/interaction is
  recorded at the right branch)? If yes, the iPad should send the effective location on all
  relevant mutations, not just session create.

### C. Any device registry?
Optional/bigger: does Foundry want a real **device registry** (each iPad registered with an
id + assigned location server-side), so location is enforced/administered centrally rather
than a local setting a user can change? That's a larger platform feature. For now the
local-setting model (device decides, stored on-device) is simpler and matches the
"device-per-tenant" philosophy already agreed. Flag for decision.

---

## Open decisions (need answers before building)

1. **Location source:** use existing `GET /api/storefront/locations` (lighter, no Foundry
   change) vs. extend `my-projects` with the store's `locationIds`? — leaning toward the
   existing locations endpoint.
2. **Who can change device location:** any operator, or manager/owner-gated? — leaning gated.
3. **Writes:** does every mutation need the effective location for audit, or is session
   create enough? — Foundry to confirm.
4. **Device registry:** local setting (now) vs. server-side device registry (later)? —
   local now, unless you want central admin.

---

## Recommended first slice (once decisions land)

If we use the existing `/api/storefront/locations` endpoint (no Foundry change):
1. `useDeviceLocationStore` (MMKV, per-slug) + `useEffectiveLocationId()`.
2. Route `useStaffProfile` + roster/appointments/session through effective location.
3. "Location" row on Profile using `LocationPickerSheet`, manager-gated.
4. First-run prompt when a store has locations but the device has none set.

This is iPad-only and shippable without waiting on Foundry — the one dependency is
confirming `/api/storefront/locations` returns all branches for the active tenant on its
host.

---

## Foundry requirements

The platform-side asks (locations endpoint confirmation, write transport, `my-projects`
`locationIds` fix, permission, device-registry decision) are written up separately for the
Foundry agent in **`07-device-location-foundry-requirements.md`**. That doc must be answered
before Phase 2+ below; Phase 1 can proceed once requirement #1 (locations endpoint) is
confirmed.

---

## Phased iPad implementation

### Phase L0 — Stop the misleading "No locations" label (ship now, no dependency)
- In `select-project.tsx` `ProjectCard`, only render the location count when > 0; never show
  "No locations" (reads like an error when it just means the list is empty/unknown).
- Purely cosmetic; unblocks the current confusing UI immediately.

### Phase L1 — Device-location store + effective resolver (needs Foundry #1)
- New `src/features/tenant/useDeviceLocationStore.ts` (MMKV id `device-location`):
  `{ [slug]: locationId }`, actions `setLocation(slug, id)`, `clearLocation(slug)`,
  selector `useActiveLocationId()`.
- New `useEffectiveLocationId()`:
  `deviceLocation(activeSlug) ?? activeProject.primaryLocationId ?? activeProject.locationIds[0] ?? null`.
- Persisted per slug so the device stays at its branch across relaunch and across users.

### Phase L2 — Route all consumers through the effective location
- `useStaffProfile().locationId` → returns `useEffectiveLocationId()` (device wins).
- Confirm downstream consumers now use it automatically:
  `useCreateSession` (session body), `useStaffRoster(locationId)` (PIN roster per branch),
  `useTodayAppointments` / `useStaffSchedules`, inventory reads.
- If Foundry chose the `X-Found-Location` header (req #3a), add it once in `src/api/client.ts`
  `request()` (like `X-Found-Operator`) sourced from `useEffectiveLocationId()` — then most
  per-endpoint `locationId` plumbing can be simplified later.

### Phase L3 — Location setting UI on Profile (needs Foundry #1, #6)
- Add a "Location" row to `app/(app)/profile/index.tsx` (the reachable settings screen), in
  or beside the Store section.
- Reuse `LocationPickerSheet` (retitle "Set device location"); it already lists
  `useLocations()`.
- On select → `setLocation(activeSlug, id)`. Row shows the current device location name.
- Gate the action per Foundry req #6 (manager/owner role, or Face-ID device-owner confirm).

### Phase L4 — First-run prompt
- After store selection, if the store has locations (`useLocations().length > 0`) and no
  device location is set for that slug, present the picker (or a non-blocking banner) before
  Home. Never let session creation run with a null location silently.
- On store switch, the per-slug store means a previously-set branch is remembered; a
  never-configured store prompts.

### Phase L5 — Cleanup / correctness
- Decide whether to retire the dormant `DeviceConfig.location_id` or make it mirror the MMKV
  value (single source of truth is the MMKV store; `DeviceConfig` can mirror for offline
  reads if needed).
- Tests: effective-location precedence, per-slug isolation, prompt logic.

### Sequencing
L0 now → (Foundry #1, #3, #6) → L1 → L2 → L3 → L4 → L5.
L2's header approach depends on Foundry #3; if they keep per-endpoint params, L2 just swaps
the source of `locationId` and skips the header.


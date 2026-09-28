# Foundry → iPad Handoff — multi-project + device-location READY

**From:** Foundry agent (`/Users/yann/Development/Foundry/foundry/`)
**To:** Lunettiq iPad team
**Status:** Foundry side **built, tested, merged, and pushed to `main`** (commit `4f3d97582`).
Requires a Vercel prod redeploy of `main` to be live (see "Deploy gate" below).
**Scope:** everything the iPad needs for (a) multi-store login/switch and (b) device-bound
location. All six device-location requirements from `07-*.md` are resolved.

---

## 0. TL;DR — what the iPad does now

On every tablet request send:

```
Authorization: Bearer <clerk_session_jwt>
X-Found-Surface: tablet
X-Found-Location: <locationId>     # the device's pinned branch (once selected)
```

- **Login/switch:** `GET /api/account/my-projects` returns the user's projects, each with
  `baseUrl`, `role`, `env`, and `ipadReady`. Show a picker when >1; select → bind the device
  to that store's `baseUrl`.
- **Locations:** `GET /api/storefront/locations` returns all active branches of the active
  store. Let a manager pin the device to one; store the `id` locally; send it as
  `X-Found-Location` thereafter.
- **Reads** scope by `?locationId=`. **Writes** attribute + scope by `X-Found-Location`.

Nothing further is required from Foundry for this flow. Remaining work is client-side (parse
+ render + send the header) and one optional platform hardening (noted at the end).

---

## 1. Multi-store login / switch (REQ from `05-*`)

### Endpoint

```
GET /api/account/my-projects
```

Response (`{ data, error, meta }`):

```jsonc
{
  "data": {
    "clerkUserId": "user_...",
    "projects": [
      { "slug": "lunettiq",      "name": "Lunettiq",      "baseUrl": "https://lunettiq.bentspline.com",      "role": "admin", "env": "production", "ipadReady": true,  "locationIds": [], "primaryLocationId": null },
      { "slug": "lunettiq-demo", "name": "Lunettiq Demo", "baseUrl": "https://lunettiq-demo.bentspline.com", "role": "admin", "env": "demo",       "ipadReady": true,  "locationIds": [], "primaryLocationId": null },
      { "slug": "bentspline",    "name": "Bentspline",    "baseUrl": "https://bentspline.com",               "role": "owner", "env": "production", "ipadReady": false, "locationIds": [], "primaryLocationId": null }
    ]
  },
  "error": null,
  "meta": { "requestId": "..." }
}
```

- **Read the array at `data.projects`** (NOT `data`, NOT `data.memberships`). This was the
  cause of the "only one store" symptom during testing — the backend returned all three;
  the client must render `data.projects`.
- Show the picker when `data.projects.length > 1`.
- `ipadReady: true` = the store has the `device-management` module enabled and is usable on
  the iPad. Flag/disable `ipadReady: false` stores in the picker (don't let the user bind a
  device to one — it will 404 on `staff-roster`).
- Ordering: `production` first, then by name.
- Auth: mobile-JWT (`x-found-user-id` from the token) with cookie fallback. `401` = no valid
  token reached the endpoint (not a data problem).
- **Bootstrap host:** call this on a host the user is already a member of (their last set
  tenant). The middleware 403s non-members on non-storefront paths, so don't call it on a
  neutral host.

### Test account (live)

`willem@sweetyams.com` → `user_3DRf3DZs6RcociiIDYqUcBDaI19` is a member of `lunettiq`
(admin), `lunettiq-demo` (admin), `bentspline` (owner). Verified live: `my-projects` returns
all three, the two lunettiq stores `ipadReady: true`.

### Adding more users

Use the admin **Staff/Team** page (`/admin/staff`) on each store — it writes
`project_members` (what `my-projects` reads) with a role-escalation guard + audit. Existing
Clerk users get access immediately; new emails get a Clerk invitation.

---

## 2. Locations (REQ1)

```
GET /api/storefront/locations   →  { data: Location[] }
```

Returns **all active branches** of the active store (unfiltered by user), on every store
host, over the tablet JWT. `id` is the same id you send back as `X-Found-Location` /
`locationId`.

⚠️ **Field-shape correction** (the earlier plan assumed wrong keys). Each Location is:

```jsonc
{
  "id": "uuid",
  "publicLabel": { "en": "...", "fr": "..." },   // localized display name — NOT `name`
  "locationType": "retail" | "warehouse" | ...,
  "address": "…",
  "operatingHours": { … },                        // NOT `hours` / `timezone`
  "isRetail": true, "fulfillsOnline": true,
  "lat": 45.5, "lng": -73.5,
  "email": "…", "phone": "…", "imageUrl": "…", "description": "…",
  "closures": [{ "label", "closedFrom", "closedTo" }]
}
```

Map `publicLabel` (localized) as the display name; there is no `isActive` field (only active
rows are returned). Live counts: `lunettiq` = 3 branches, `lunettiq-demo` = 2.

---

## 3. Device-bound location (REQ3) — what's live

**Transport:** send `X-Found-Location: <locationId>` on tablet requests. Model:
**trusted-but-validated** — the device is trusted to declare its branch, but Foundry rejects
an id that isn't a real active location of the tenant with a **400** (never 403, never silent
accept, never cross-tenant).

**Writes (all wired):**

| Write | Behaviour |
|---|---|
| `POST /api/clients/{id}/tryon-sessions` | `locationId` from body OR `X-Found-Location`; validated; stored |
| `POST /api/inventory/protections` | header fills `locationId` when body omits it; validated |
| `POST /api/scheduling` (create appointment) | header fallback; location optional but validated if present |
| orders / sales | **attribution only** — `pickupLocationId` is the customer's chosen fulfillment location, not the device branch, so it's not overwritten. The device branch is recorded in the audit log instead. |

**Attribution:** every tablet mutation is stamped with the device branch in
`audit_log.location_id` automatically (resolved from `X-Found-Location`). So even
attribution-only writes (orders) are correctly tied to the branch the device is at.

**Validation contract for the client:** if you send an `X-Found-Location` that isn't a real
active location of the active store, location-scoped writes return
`400 { error: { code: 'VALIDATION', message: 'locationId is not an active location of this project' } }`.
Only send ids you got from `GET /api/storefront/locations`.

---

## 4. Reads scoped by location (REQ4)

Pass `?locationId=<id>` to scope:

- `GET /api/scheduling?locationId=` — today's appointments for the branch
- `GET /api/scheduling/slots?locationId=` — slots for the branch
- `GET /api/admin/device/staff-roster?locationId=` — lock-screen roster for the branch
  (gated on `device-management` + `deviceQuickSwitch` enabled)

**Omit `locationId` → returns ALL** (no implicit tenant default). For a pre-config default
branch, the iPad should pick one from the locations list (e.g. first `isRetail`).

---

## 5. Decisions (REQ2, 5, 6)

- **REQ2 — `my-projects.locationIds`:** user-centric (the user's assigned locations), device
  location comes from §2. Empty today for users with no `staff` profile on that store —
  assign via `/admin/staff` if you want the fallback populated. Not a bug.
- **REQ5 — device registry:** **local** for now (store the pinned location in iPad settings;
  a manager sets it). No server-side device identity exists; a central registry is a separate
  future project.
- **REQ6 — permission to change device location:** gate the client action on the per-project
  `role` from `my-projects` (recommend `admin`/`owner`). No dedicated server permission today.

---

## 6. Deploy gate + verification

- **The data is already live** (memberships, locations) regardless of deploy.
- **The code (my-projects `ipadReady`, device-location writes/attribution) is on `main`
  (`4f3d97582`) but needs a Vercel prod redeploy** to be served. Confirm the deployment
  includes `4f3d97582` (or later) before final iPad testing.
- **Verify on prod** (browser or token):
  ```
  GET https://lunettiq.bentspline.com/api/account/my-projects   → 3 projects, 2 ipadReady
  GET https://lunettiq.bentspline.com/api/storefront/locations  → active branches
  ```
- A `401` on `my-projects` = no valid token reached it (auth/host issue), not a backend gap.

---

## 7. What remains (all client-side or optional)

1. **iPad client:** render `data.projects` (the earlier "one store" bug was the client not
   reading the array), send `X-Found-Location`, map `publicLabel`/`operatingHours` from the
   locations endpoint. No Foundry work.
2. **Optional platform hardening (not required for correctness):** `X-Found-Location` is not
   in the middleware header-strip list (`src/proxy.ts` is a protected file the agent couldn't
   edit), so it's forgeable — but only to a *valid active location of the caller's own
   tenant* (all validation is `projectId`-scoped, no cross-tenant reach). A maintainer with
   write access to `proxy.ts` can add `'x-found-location'` to `FOUND_HEADERS` for
   defense-in-depth. Flagged, not hidden.

**Bottom line:** with `main` deployed, multi-store login/switch, authoritative locations,
location-scoped reads, and location-attributed + validated writes all work end-to-end. The
remaining pieces are the iPad rendering the data it already receives.

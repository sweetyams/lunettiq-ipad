# Foundry requirements — device-bound location

**From:** iPad team
**To:** Foundry agent (`/Users/yann/Development/Foundry/foundry/`)
**Purpose:** Everything the platform must provide/confirm so the iPad can bind a physical
location to a **device** (not a user). iPad A = Montreal, iPad B = Toronto; any staff can log
into either, but the device stays pinned to its branch until the setting is changed.
**Companion:** `06-device-location-scope.md` (iPad-side plan). Answer the questions here
first — they gate the iPad build.

---

## Context: how the iPad uses location today

The app already sends/reads `locationId` in these calls (all on the active store's host,
mobile-JWT, `X-Found-Surface: tablet`):

| Call | Method | How location rides today |
|---|---|---|
| `GET /api/storefront/locations` | GET | (none) returns the tenant's location list |
| `POST /api/clients/{clientId}/tryon-sessions` | POST | `locationId` in **body** |
| `GET /api/scheduling?date=&locationId=` | GET | `locationId` **query param** |
| `GET /api/scheduling/slots` | GET | `locationId` query param |
| `GET /api/admin/device/staff-roster?locationId=` | GET | `locationId` query param |
| `GET /api/inventory/protections` | GET | (no location today) |
| `POST /api/inventory/protections` | POST | body (no location today) |

So location handling is **inconsistent** (body here, query there, absent elsewhere). Part of
this ask is to standardise it.

---

## REQUIREMENT 1 — Authoritative location list per tenant (BLOCKING)

The iPad needs the definitive list of a store's physical locations so the device can be
pinned to one. It already calls:

```
GET /api/storefront/locations   →  Location[]
```
returning `{ id, name, address, city, province, postalCode, phone, email, hours, timezone, isActive }`.

**Confirm all of the following:**

1. **Does this endpoint return ALL branches of the active tenant** (not filtered to the
   caller's assigned locations)? The device must be pinnable to any branch regardless of who
   logs in. If it's user-filtered, we need an unfiltered variant or a flag.
2. **Is it available on every store host** (`lunettiq.bentspline.com`,
   `lunettiq-demo.bentspline.com`, etc.), tenant-resolved by host like everything else?
3. **Is `id` the same identifier** accepted as `locationId` by the write/read endpoints above
   (sessions, scheduling, inventory)? i.e. the id I pin on the device is the id I send back.
4. **Auth:** the code comment calls it "public." Confirm it works with the tablet mobile-JWT
   and returns the tenant's locations (not a marketing subset).

If yes to all → **no new endpoint needed**; the iPad uses this directly. This is the
preferred, lightest path.

---

## REQUIREMENT 2 — Decide: is `my-projects.locationIds` the user's or the store's? (BLOCKING)

Right now `my-projects` returns **empty `locationIds`** for our founder test user, which is
why the picker shows "No locations." Clarify the intended semantics:

- **Option A (preferred for device-binding):** `my-projects` stays user-centric
  (`locationIds` = the user's assigned locations, `primaryLocationId` = their default), and
  the **device location comes from REQUIREMENT 1's full list**. The device overrides the
  user default. In this model, please still **populate `locationIds`/`primaryLocationId`
  correctly** (they're empty today) so the pre-device-config fallback works.
- **Option B:** `my-projects.locationIds` returns the **store's full location list**. Then
  the iPad wouldn't need REQUIREMENT 1 at selection time. But this overloads a per-membership
  field with store-level data — not recommended.

**Decision needed:** confirm Option A, and fix the empty-`locationIds` bug so a user with
location assignments actually gets them.

---

## REQUIREMENT 3 — How should location ride on WRITES? (BLOCKING for audit correctness)

The whole point of device-location is that a sale/interaction/session is attributed to the
**branch the device is at**. Confirm the convention the iPad should use on mutations:

1. **Standardise the transport.** Options:
   - a) An `X-Found-Location: <locationId>` **header** the iPad sends on every request
     (cleanest — one place in the API client, applies to all calls). **Preferred.**
   - b) Continue per-endpoint (`locationId` in body/query). Works but inconsistent.
   - Please pick one. If (a), confirm Foundry reads `X-Found-Location` and it's honoured for
     audit + data scoping.
2. **Which writes must carry location?** At minimum: `tryon-sessions` (already does),
   `inventory/protections` (holds should be at the device's branch), product interactions,
   and any sale/order write. List the mutations where Foundry wants location for correct
   branch attribution.
3. **Validation:** if the iPad sends a `locationId` the user isn't permitted for, what does
   Foundry do — accept (device is trusted), 403, or ignore? Define it.

---

## REQUIREMENT 4 — Reads scoped by location: confirm behaviour

For GETs that take `locationId` (scheduling, staff-roster, inventory):

1. When the iPad sends the **device** location, confirm the endpoint filters to that branch
   (today's appointments for THIS store, roster for THIS branch, stock for THIS branch).
2. `staff-roster?locationId=` — confirm passing a location filters the PIN roster to staff at
   that branch. (This is how the lock screen should scope operators per device location.)
3. If `locationId` is omitted, what's the default — all locations, or the tenant default?
   The iPad relies on this for the pre-config fallback.

---

## REQUIREMENT 5 — Device registry? (DECISION, not necessarily build)

Two models for *where* the device→location binding lives:

- **Local (iPad-side, now):** the device stores its location in local settings; a
  manager sets it on the iPad. Simple, no platform work, matches the agreed
  "device-per-tenant" philosophy. **iPad can ship this without Foundry.**
- **Server-side device registry (later, bigger):** each iPad is registered in Foundry with a
  device id + assigned location, administered centrally; the app reads its assignment. This
  enforces location centrally and survives app reinstalls, but is a real platform feature
  (device identity, an admin UI, an endpoint like `GET /api/admin/device/config`).

**Decision needed:** local now, or do you want the server-side registry? If server-side,
that's a separate scoped project; specify the endpoint shape and how a device authenticates
its identity (the app currently has no device id — only the Clerk user + host).

---

## REQUIREMENT 6 — Permission to change device location

Changing the branch a till is pinned to shouldn't be a casual per-SA action. Does Foundry
expose a permission/role the iPad can check (e.g. `org:location:manage`, or the existing
role from `my-projects` — owner/admin vs sales_associate) to gate the "change device
location" action? Confirm which role/permission the iPad should require, or say "any operator
may change it."

---

## Summary of what we need back

| # | Item | Type | Blocks iPad? |
|---|---|---|---|
| 1 | `/api/storefront/locations` returns all tenant branches, per host, ids match writes | Confirm | **Yes** |
| 2 | `my-projects.locationIds` semantics + fix empty list | Confirm + fix | Yes (fallback) |
| 3 | Write transport for location (prefer `X-Found-Location` header) + which writes need it | Decide | **Yes** (audit) |
| 4 | Read filtering by `locationId` (scheduling, roster, inventory) + omit default | Confirm | Partial |
| 5 | Local setting vs server-side device registry | Decide | Direction |
| 6 | Permission to change device location | Confirm | Nice-to-have |

**Minimum to unblock the iPad's first slice:** #1 (confirm the locations endpoint) and #3
(pick the write convention). With those two answered, the iPad can ship device-bound
location as a local setting (#5 = local) without further platform work.

Please reply inline against each numbered requirement.


---

# FOUNDRY RESPONSE (2026-09-28)

**From:** Foundry agent (`/Users/yann/Development/Foundry/foundry/`)
**Method:** verified against source + live DB, not assumed. File refs are exact.

## REQ 1 — Authoritative location list — ✅ CONFIRMED (with a shape correction)

Endpoint exists: `src/app/(project)/api/storefront/locations/route.ts`.

1. **Returns ALL branches of the active tenant** — yes. Query is
   `WHERE project_id = ctx.id AND active = true`, with **no user/location filtering**.
   The device can be pinned to any active branch regardless of who logs in. Verified
   live: `lunettiq` = 3 active locations, `lunettiq-demo` = 2.
2. **Per host** — yes. Tenant resolves from host via `getProjectContext()` like every
   other route. Works on `lunettiq.bentspline.com`, `lunettiq-demo.bentspline.com`, etc.
3. **`id` matches the write id** — yes. It selects `locations.id`, which is the same
   UUID accepted as `locationId` by scheduling (`appointments.locationId`), staff-roster,
   etc. The id you pin is the id you send back.
4. **Auth** — it uses `getProjectContext()` only (no `requirePermission`), so it's
   effectively public/any-authenticated and works over the tablet mobile-JWT. It returns
   the tenant's real operational locations, not a marketing subset.

⚠️ **Shape correction — the doc's assumed fields are wrong.** The endpoint does NOT
return `{ name, city, province, postalCode, phone, email, hours, timezone, isActive }`.
Actual response is `{ data: Location[] }` where each Location is:

```jsonc
{
  "id": "uuid",
  "publicLabel": { "en": "...", "fr": "..." },   // localized, NOT `name`
  "locationType": "retail" | "warehouse" | ...,
  "address": "…",
  "contactDetails": { … },
  "mapLink": "…",
  "isRetail": true,
  "fulfillsOnline": true,
  "lat": 45.5, "lng": -73.5,
  "operatingHours": { … },                        // NOT `hours`/`timezone`
  "email": "…", "phone": "…",
  "imageUrl": "…", "description": "…",
  "closures": [{ "label", "closedFrom", "closedTo" }]  // active closures only
}
```

Note: `active` is a filter (only active rows are returned) — there is no `isActive` field
on the row. **Action for iPad:** map `publicLabel` (localized) as the display name and
`operatingHours` for hours. No new endpoint needed — use this directly. → **UNBLOCKED.**

## REQ 2 — `my-projects.locationIds` semantics — ✅ Option A confirmed; empty list is NOT a bug

**Decision: Option A.** `my-projects` is user-centric — `locationIds` = the user's
assigned locations, `primaryLocationId` = their default. Device location comes from
REQ 1's full list. We are **not** overloading the per-membership field with store data.

**Why it's empty for the founder — and why that's correct, not a bug:** `getMyProjects`
(`src/lib/platform/my-projects/queries.ts`) reads `staff.locationIds` for the caller per
project. Verified live: the founder (`user_3DRf3D…`) has a `staff` row **only on
bentspline** (with empty locations) and **no `staff` row on lunettiq / lunettiq-demo at
all**. The earlier founder-access seed added `project_members` (access) but not a tenant
`staff` profile (location assignment). So the query correctly returns `[]` — there is no
data to return. The query itself is correct and needs no fix.

**To populate `locationIds` for a user:** they need a `staff` profile with
`location_ids`/`primary_location_id` set for that project. The normal path already does
this — the admin **Staff/Team invite** (`POST /api/staff`, existing-Clerk-user branch)
creates the `staff` row with `locationIds`. For the founder specifically, assign them
locations via `/admin/staff` on each lunettiq store (or `POST /api/staff/{id}` action
`assign-locations`). Once assigned, `my-projects` returns them.

So: **no code fix required** — the "empty locations" is a data-completeness item
(founder has no staff profile on those stores), not an endpoint bug. The pre-device-config
fallback works as soon as staff locations exist.

## REQ 3 — Location on WRITES — ⚠️ header NOT yet honored; needs platform work

**Preferred transport (a) `X-Found-Location` header is NOT implemented server-side.**
Verified: `X-Found-Location` appears only in iPad-side docs; nothing in `src/proxy.ts` or
any handler reads it. What exists today is `x-found-locations` (plural) — the user's
assigned locations from membership — which is a different concept from a device-pinned
location.

Also: the `audit()` primitive (`src/lib/platform/audit.ts`) has **no `location` field**
today, so branch attribution on audit rows isn't capturable yet even if the header arrived.

**To adopt the header cleanly (recommended), Foundry needs to:**
1. Middleware (`src/proxy.ts`) — pass an incoming `X-Found-Location` through as a trusted
   header on the mobile-JWT (tablet) path, after the existing header-strip step.
2. `audit()` — add an optional `location` field written to the audit row (the whole point:
   attribute the interaction to the device's branch).
3. Handlers that mutate — read the device location (header first, body/query fallback).

This is a small, scoped platform change (~middleware + audit + a helper to read it).
**Confirm you want the header approach and I'll implement it** — it's the right call
(one place in the API client vs. per-endpoint), but it is NOT free/already-done. Until
then, the per-endpoint transport works: `tryon-sessions` (body), `scheduling`
(query/body).

**Writes that should carry location (for branch attribution):** `tryon-sessions`
(already), `inventory/protections` (holds belong to the device's branch), `scheduling`
create (already accepts body `locationId`), and any sale/order write. I'll finalize the
exact list when wiring the header.

**Validation (device trusted vs 403):** recommendation — the device is trusted for its
pinned location; accept the sent `locationId` and record it, but validate it's a real
active location of the tenant (reject unknown ids with 400). Do **not** 403 on
"user isn't assigned there" — the device, not the user, owns the location. Confirm and
I'll enforce exactly that.

## REQ 4 — Reads scoped by location — ✅ CONFIRMED

Verified in `src/lib/modules/scheduling/handlers.ts` and the staff-roster route:

1. **Scheduling** — `GET /api/scheduling?locationId=` filters `appointments.locationId`;
   `GET /api/scheduling/slots?locationId=` filters `staffSchedules.locationId`. Passing the
   device location returns that branch's appointments/slots. ✅
2. **staff-roster** — `?locationId=` filters the roster to staff whose `locationIds`
   include it (or whose `primaryLocationId` matches). This is exactly how the lock screen
   should scope operators per device. Note: the endpoint is gated on the
   `device-management` module **and** `deviceQuickSwitch` being enabled (404 otherwise). ✅
3. **Omit `locationId`** — returns **ALL** (all appointments / all active staff). There is
   **no implicit tenant-default location**. So the iPad's pre-config fallback = "show
   everything for the store." If you want a single default branch pre-config, the iPad
   should pick one from REQ 1's list (e.g. first `isRetail`), because the server won't.

## REQ 5 — Device registry — RECOMMEND LOCAL (now)

Go **local** for the first slice. Rationale: there is currently **no device identity** in
the platform — auth is Clerk user + host only; nothing issues or tracks a device id. A
server-side registry (device id, admin UI, `GET /api/admin/device/config`, device auth) is
a genuine separate scoped project, not a small add. It matches the agreed
"device-per-tenant, till-like" philosophy to store the pinned location in iPad settings and
let a manager set it on the device. **iPad can ship device-bound location as a local
setting with zero further platform work** (given REQ 1 + the REQ 3 transport decision).
If/when you want central enforcement + reinstall-survival, open that as its own project and
I'll spec the endpoint + device-auth model.

## REQ 6 — Permission to change device location — use role from `my-projects`

There is **no `org:location:manage` permission** defined today. The pragmatic gate: use the
per-project `role` already returned by `my-projects` (owner / admin / manager vs
sales_associate). Recommendation: **restrict "change device location" to `admin` or
`owner`** (a manager-level action, not a casual SA action). The iPad can check
`project.role` from the `my-projects` response — no server round-trip needed. If you'd
rather it be any operator, that's fine too; say which and I'll note it as the contract. If
you want a real dedicated permission, that's a small manifest addition I can make.

## Summary — what's actually blocking vs done

| # | Status | Note |
|---|---|---|
| 1 | ✅ Done (no work) | Endpoint returns all active branches per host; **map `publicLabel`/`operatingHours`, not `name`/`hours`** |
| 2 | ✅ No code fix | Option A confirmed; empty list = founder has no `staff` profile on those stores; assign via `/admin/staff` |
| 3 | ⚠️ Needs platform work | `X-Found-Location` NOT honored yet + `audit()` has no location field. Confirm header approach → I implement middleware + audit + handler reads |
| 4 | ✅ Confirmed | scheduling/slots/roster filter by `locationId`; omit = ALL (no tenant default) |
| 5 | ✅ Decision: local | No device identity exists; server registry = separate project |
| 6 | ✅ Guidance | Gate on `role` from `my-projects` (admin/owner); no dedicated perm today |

**Minimum to unblock the iPad's first slice:** REQ 1 is done; REQ 3 needs one decision from
you (adopt `X-Found-Location`?) before I wire the write-path + audit. Everything else is
either confirmed or a local iPad choice. **Reply on REQ 3 (header yes/no) and REQ 3
validation (accept-trusted vs 400-on-unknown) and I'll implement the platform side.**


---

# REQ 3 — IMPLEMENTED (Foundry, 2026-09-28)

Decision taken: **adopt `X-Found-Location`** header, **trusted-but-validated** (accept the
device's location, but reject an id that isn't a real active location of the tenant with a
400 — never 403, never silent accept). Shipped:

**What the iPad does now:** send `X-Found-Location: <locationId>` on tablet requests
(alongside `Authorization: Bearer` + `X-Found-Surface: tablet`). One place in your API
client.

**Foundry side (implemented + tested):**
- `getDeviceLocationId()` / `resolveDeviceLocation(bodyLocationId)` in
  `src/lib/platform/context.ts` — read the header (mirrors `getSurface`); body id wins,
  else the device header.
- `isActiveLocation(ctx, id)` in `src/lib/modules/location-management/queries.ts` —
  validates the id is a real **active** location of THIS tenant (query scoped by
  `projectId`, so a foreign id simply returns no row → false).
- `audit()` (`src/lib/platform/audit.ts`) now writes the device branch to the existing
  `audit_log.location_id` column automatically — precedence `entry.locationId ?? session.locationId ?? X-Found-Location header`. **No migration needed** (the column already existed). So every tablet mutation is branch-attributed with zero per-handler work.
- `StaffSession.locationId` added (`permissions.ts`) for handlers that want it explicitly.
- **`tryon-sessions` create is fully wired** as the reference: `locationId` may now come
  from the body OR `X-Found-Location`; it's validated (400 if unknown/inactive) and stored
  on the interaction. Tests cover header resolution, body precedence, and validation reject.

**Remaining writes to wire (same 3-line pattern as tryon-sessions):**
`inventory/protections`, `scheduling` create, and any order/sale write. These currently
still take `locationId` from body/query only and are **not yet** device-fallback-enabled.
They already get correct **audit attribution** for free (audit reads the header). I did NOT
wire their data-scoping in this pass to keep the change proportional — say the word and I'll
apply the identical `resolveDeviceLocation` + `isActiveLocation` pattern to each.

**One caveat (security, by design):** `src/proxy.ts` is a frozen/protected middleware file
I can't modify, so `X-Found-Location` is **not** added to the header-strip list. It passes
through to handlers unstripped, which means a client could *forge* it. This is acceptable
under the trusted-but-validated model: a forged value only lets a device claim a **valid,
active location of its own tenant** (every read is `projectId`-scoped) — it cannot reach
another tenant's data. If you want middleware-level strip+re-issue for defense-in-depth,
that's a one-line change to `FOUND_HEADERS` in `proxy.ts` that a maintainer with write
access to that file must make. Flagging explicitly rather than pretending it's covered.

**Tests:** `context.device-location.test.ts` (6), `is-active-location.test.ts` (5),
existing `location-management/handlers.test.ts` (28) all green; `tsc --noEmit` clean.

Status flip: REQ 3 was "⚠️ needs platform work" → now **implemented** for attribution +
the tryon-sessions reference write, with the remaining writes and the proxy-strip caveat
called out above.

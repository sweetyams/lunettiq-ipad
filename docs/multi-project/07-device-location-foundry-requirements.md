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

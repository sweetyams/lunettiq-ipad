# Foundry → iPad Handoff (multi-project)

**Status:** Foundry side built + committed (`feat/my-projects-endpoint`), verified against live DB. **Not yet deployed.**
**Audience:** Lunettiq iPad team — lock the client contract and build the iPad phases below against this.
**Model:** device = ONE set tenant at a time (like a physical till), changeable.
**Source of truth for the endpoint:** the Foundry repo. This is the report-back companion to `02-foundry-agent-prompt.md`.

---

## 0. The model (read this first)

The iPad is a **device bound to one tenant ("entity") at a time**. The binding is
changeable but deliberate — not a per-transaction toggle. Two independent auth layers:

| Layer | Established | Scope | Persists across auto-lock? |
|---|---|---|---|
| **Clerk login** | Once, at setup | The person (cross-tenant identity) | **Yes** — the Clerk session runs the device |
| **Set tenant** | After login, from `my-projects` | Binds the device to one project host | Yes — stored locally (`useTenantStore`) |
| **PIN quick-switch** | Every auto-lock/unlock | The operator, **within the set tenant only** | N/A — PIN gates the human, not the session |

Gate flow:

```
Log in (Clerk, once)
  → GET /api/account/my-projects        (discover memberships)
  → SET TENANT  (device binds to e.g. lunettiq-demo; store its baseUrl)
  → operate; auto-lock → unlock with THAT tenant's staff PIN (e.g. Yann = 222)
  → [Sign out]  or  [Change tenant]  (both in Settings/More — deliberate, not quick)
```

**Why this is clean (verified against Foundry code):**

- **PIN namespace is per-tenant.** `/api/admin/device/authenticate`, `verify-pin`, and
  `staff-roster` all query `WHERE project_id = ctx.id` — the *set tenant*, resolved from
  the host. Yann's `222` in `lunettiq-demo` is a separate namespace from anyone's `222`
  in `lunettiq`. **Conflicting PINs across tenants cannot collide.** No global uniqueness,
  no Foundry change.
- **Auto-lock keeps the Clerk session.** `verify-pin`/`staff-roster` require
  `requirePermission(ctx, 'org:staff:read')` — i.e. the device's Clerk session must be
  live. Auto-lock hides the operator behind the PIN; it does **not** drop the Clerk
  session. Unlock = PIN check against the set tenant. Only "Sign out" ends the session.
- **No cross-tenant quick-switch.** PIN quick-switch swaps *operator within the set
  tenant*. Changing tenant is a separate, heavier action (re-select + clear local DB +
  reset operator). Do not conflate them.

---

## 1. Endpoint — LOCK YOUR CONTRACT AGAINST THIS

```
GET /api/account/my-projects
```

⚠️ **Path is `/api/account/my-projects`**, NOT the plan's `/api/platform/my-projects`
(the platform namespace is reserved for Foundry staff via `requirePlatformRole`; opticians
aren't platform users). Update `01-ipad-plan.md` and any `PLATFORM_BOOTSTRAP_URL` constant.

**Request headers:**
```
Authorization: Bearer <Clerk JWT>
X-Found-Surface: tablet
```

**Response (200):**
```jsonc
{
  "data": {
    "clerkUserId": "user_...",
    "projects": [
      {
        "slug": "lunettiq",
        "name": "Lunettiq",
        "baseUrl": "https://lunettiq.bentspline.com",  // authoritative — use verbatim, never construct
        "role": "owner",                                // per-project role
        "locationIds": [],                              // string[]
        "primaryLocationId": null,                      // string | null
        "brandMark": "L",                               // OPTIONAL — key absent when unset
        "env": "production"                             // "production" | "demo" | "staging"
      }
    ]
  },
  "error": null,
  "meta": { "requestId": "..." }
}
```

**Contract guarantees:**
- Zero memberships → `200` with `projects: []`. Empty list is success — show a "no access"
  screen, don't treat as failure.
- Ordering: `production` first, then alphabetical by `name`.
- `brandMark` optional — treat as `undefined` when absent.
- `baseUrl` includes scheme + host. Never derive hosts client-side.

---

## 2. Which host to call it on (bootstrap host — resolves open-question #2)

Call `my-projects` on the **current / last-known set-tenant host** — the one the user is a
member of. NOT a neutral `app.bentspline.com`.

Reason: the mobile-JWT middleware resolves the tenant from the host and returns **403** if
the JWT user isn't a member of that tenant (all non-storefront paths). Because the device is
always bound to a tenant the user belongs to, this always passes — and the model makes the
bootstrap-host problem disappear.

`PLATFORM_BOOTSTRAP_URL` recommendation:
- Persist the last set-tenant `baseUrl` (MMKV / `useTenantStore`).
- First launch / no stored host → default `https://lunettiq.bentspline.com`.
- Call `{host}/api/account/my-projects`, let the user Set Tenant, then persist the choice.

---

## 3. Error handling — "wrong project" vs "login expired"

| Status | Code | Meaning | iPad action |
|---|---|---|---|
| `200` + `projects: []` | — | Valid login, no memberships | "No access" screen |
| `401` | `UNAUTHORIZED` | Missing/invalid/expired JWT | Re-auth (Clerk sign-in) |
| `403` | `FORBIDDEN` | Valid login, not a member of the host's project | Fall back to a host they belong to / re-Set Tenant |

There is **no literal `NOT_A_MEMBER` code** — gate on **status** (403 vs 401), not string.

---

## 4. Device / PIN endpoints (already built — call on the SET TENANT host)

All under the set-tenant host, all require a live Clerk session (`X-Found-Surface: tablet`).
Gated by the `device-management` module + `deviceQuickSwitch.enabled` setting (both live on
`lunettiq-demo`).

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/device/staff-roster?locationId=…` | Lock-screen roster: `{ staffId, clerkUserId, name, role, imageUrl, hasPinSet }[]` (set tenant only) |
| `POST /api/admin/device/verify-pin` `{ staffId, pin }` | Unlock a specific operator. 200 identity / 401 wrong (remaining attempts) / 423 locked |
| `POST /api/admin/device/authenticate` `{ pin }` | PIN-only unlock (no staffId) — matches any set-tenant staff PIN |
| `POST /api/admin/device/set-pin` `{ staffId?, pin }` | Set/update a PIN (self or, with `org:staff:write`, others) |

Lockout: 5 fails → 5 min, 10 → 10 min, 15+ → 30 min (per staff, per tenant).
Operator attribution: send `X-Found-Operator: <clerkUserId>` on subsequent calls so audit
attributes actions to the active operator while the device session owner is preserved.

---

## 5. Environment facts (confirmed)

- **Shared Clerk instance:** ✅ one instance across all projects (single `CLERK_SECRET_KEY`,
  one global user pool). One login sees every project it's a member of. (Resolves
  open-question #1.)
- **Host mapping:** `custom_domain` if set, else `{slug}.bentspline.com`
  (dev: `{slug}.localhost:4000`). Both lunettiq projects have no custom domain.
- **`env` vocabulary:** `production | demo | staging`, from `settings.env` or slug suffix.
  Use `env === 'demo'` for the demo-indicator strip. (Resolves open-question #3.)

---

## 6. Test account (seeded + verified live)

- **`benjamin@lunettiq.com`** → `user_3GJcIVjU0f7GwuzgAfEOdll9I2c`
- Member of both: `lunettiq` (owner) + `lunettiq-demo` (admin).
- `my-projects` returns both with correct hosts/env (verified).

---

## 7. Founders / platform users (decided)

`my-projects` reads `project_members` only. A pure founder/platform user has no membership
rows → returns `[]`. **Decision: a founder who needs an iPad is added as a member of that
tenant** (one seed row), same as anyone. No "founder sees all projects" branch — the
device-per-tenant model makes it unnecessary and avoids widening who can bind a device.

---

## 8. Local dev smoke test

```bash
curl -H "Authorization: Bearer <clerk_jwt>" \
     -H "X-Found-Surface: tablet" \
     http://lunettiq.localhost:4000/api/account/my-projects
```

---

## 9. PHASES

### Foundry side

- **F1 — my-projects endpoint** — ✅ DONE (committed, DB-verified).
- **F2 — demo membership seed** — ✅ DONE (benjamin on lunettiq-demo).
- **F3 — Deploy** — ⏳ push `feat/my-projects-endpoint` → PR → merge → deploy. *Blocks all iPad integration testing.*
- **F4 — Real-HTTP proof** — ⏳ run the §8 curl with a real Clerk JWT (unit + DB verified; HTTP path unproven).
- **F5 (only if needed)** — proxy carve-out so a neutral bootstrap host works. NOT needed under this model; skip unless the iPad insists on `app.` bootstrap.

### iPad side (your PRs)

- **P1 — Runtime tenant binding.** `useTenantStore` (MMKV) holds `{ slug, baseUrl, role, locationIds, primaryLocationId, env }`. Retire build-time `BASE_URL` (`src/api/client.ts`, `DesignTokenProvider.tsx`) and the hardcoded `.lunettiq` slug (`useStaffProfile.ts`). Every `api.*` call uses `activeProject.baseUrl` + Clerk JWT + `X-Found-Surface: tablet`.
- **P2 — Per-tenant WatermelonDB isolation.** DB name per slug (factory-by-slug in `src/db/index.ts`, `src/sync/useInitialSync.ts`). **Highest-risk item** — without it, Change Tenant mixes demo and production client data. Change Tenant MUST close/replace the DB.
- **P3 — Gate: Log in → my-projects → Set Tenant.** Post-login: 0 → "no access"; 1 → auto-select; N → select-project list (`name`, `env` badge, `brandMark`). Persist choice, open that tenant's DB, fetch `/api/design/native` on that host, run initial sync.
- **P4 — Auto-lock + PIN unlock (set tenant).** On lock, keep the Clerk session; show `staff-roster` for the set tenant; unlock via `verify-pin`/`authenticate`. Set `X-Found-Operator` after unlock. Handle 401/423.
- **P5 — Settings actions.** "Sign out" (ends Clerk session) and "Change tenant" (re-runs P3 — unsynced-changes guard, query-cache clear, DB swap, operator + privacy reset). Both deliberate; NOT quick-switch.
- **P6 — Demo indicator.** ModeStrip variant when `activeProject.env === 'demo'`.

### Sequencing

F3 → (P1 → P2 → P3 → P4 → P5 → P6). P2 gates P3 (don't ship Set Tenant without DB isolation).
Final: two-membership test on-device (F4 + P3) — offline sync must survive a Change Tenant and
drain the correct project's queue.

---

## 10. Explicitly OUT of scope

- Cross-tenant PIN quick-switch (only operator-within-tenant).
- Cross-identity account merging (two Clerk users never merge; log out/in to switch identity).
- Founder "see all projects" endpoint branch.
- A neutral `app.` bootstrap host (device always boots from its set-tenant host).

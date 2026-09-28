# Multi-project (multi-tenant) support — shared plan

Status: proposed
Owners: Foundry platform team + Lunettiq iPad team
Last updated: 2026-09-28

This document is the single source of truth for adding multi-project support to the
Lunettiq iPad app. Both teams work from it. The iPad-specific execution steps live in
`01-ipad-plan.md`; the Foundry work is summarised here and expanded in the agent prompt
`02-foundry-agent-prompt.md`.

---

## 1. The agreed model

Two independent axes:

- **Identity** = the Clerk user (`sub` → `clerkUserId`). One person, one login, works
  across every project they belong to.
- **Project / tenant** = resolved by **host** on every request. Foundry gates access with
  `project_members(projectId, userId)`.

Consequences that drive the whole design:

- Multi-account on the iPad = *same Clerk login, repointed at a different project host*.
- It is **login-onward only**. API keys are explicitly **not** part of this. An API key
  identifies a key (single project, baked-in role), not a person — it breaks audit
  attribution, PIN quick-switch, and per-project role resolution. API keys remain for
  headless/server-to-server callers only.
- The only missing primitive is **project discovery**: a way for the app to learn which
  projects the logged-in user belongs to, and each project's authoritative host.

---

## 2. Auth methods (reference)

| Method       | authMethod | Identifies              | Multi-project story |
|--------------|------------|-------------------------|---------------------|
| Mobile JWT   | mobile-jwt | Real Clerk user (`sub`) | Per request, checks `project_members`. Same user → any project they're a member of. **This is the iPad path.** |
| API key      | api-key    | A key, not a person     | Minted per project, fixed role. Headless/MCP only. **Not used by the iPad.** |
| Clerk cookie | (default)  | Clerk user (browser)    | Web admin only. |

There is **no API key anywhere** in the iPad flow. The only credential is the Clerk JWT.

---

## 3. The handshake (end to end)

```
Login (Clerk)  →  JWT
      │
      ▼
GET /api/platform/my-projects   (bootstrap host, Bearer JWT, X-Found-Surface: tablet)
      │
      ├─ 0 projects → block with message
      ├─ 1 project  → auto-select (preserves today's single-tenant UX)
      └─ N projects → SELECT-PROJECT screen (iPad UI)
      │
      ▼
setActiveProject({ slug, baseUrl, role, locations })   → useTenantStore (MMKV)
      │
      ▼
open WatermelonDB for slug  →  fetch /api/design/native (that host)  →  initial sync (that host)
      │
      ▼
/(app)/home  — all api.* calls use activeProject.baseUrl + Clerk JWT.
                Foundry checks project_members(project, userId) per request.
```

---

## 4. The discovery endpoint (Foundry owns)

> **AS-BUILT (locked 2026-09-28).** The endpoint is built + committed on Foundry branch
> `feat/my-projects-endpoint` (commit `f246c978b`), verified against the live DB, **not yet
> deployed**. Deltas from the original proposal below:
>
> - **Path is `/api/account/my-projects`** (not `/api/platform/...`). `/api/platform/*` is
>   hard-gated to Foundry platform staff; opticians aren't platform users. This is per-user
>   self-service identity, so it lives under `/api/account/*`.
> - **Call it on a project host the user belongs to**, not a neutral host. The mobile-JWT
>   middleware resolves a tenant from the host and 403s if the user isn't a member. Bootstrap
>   from the last-known/default project baseUrl (see §4a).
> - **No `NOT_A_MEMBER` code** — gate on HTTP status: `200 + []` = no access, `401` = re-auth,
>   `403` = wrong project (fall back to a host the user belongs to).
> - **Shared Clerk instance: confirmed yes** (one user pool). Resolves §9 Q1.
> - **`env` vocab: `production | demo | staging`.** Resolves §9 Q3.
> - Ordering: production projects first, then alphabetical by name. `brandMark` optional.
> - Test account: `benjamin@lunettiq.com` (`user_3GJcIVjU0f7GwuzgAfEOdll9I2c`), member of
>   `lunettiq` (owner) + `lunettiq-demo` (admin).

```
GET /api/account/my-projects
Auth: mobile-jwt (Authorization: Bearer <Clerk token>)
Headers: X-Found-Surface: tablet
```

Response:

```jsonc
{
  "data": {
    "clerkUserId": "user_2abc...",
    "projects": [
      {
        "slug": "lunettiq",
        "name": "Lunettiq",
        "baseUrl": "https://lunettiq.bentspline.com",
        "role": "optician",
        "locationIds": ["loc_mtl_01", "loc_mtl_02"],
        "primaryLocationId": "loc_mtl_01",
        "brandMark": "L",
        "env": "production"
      },
      {
        "slug": "lunettiq-demo",
        "name": "Lunettiq (Demo)",
        "baseUrl": "https://lunettiq-demo.bentspline.com",
        "role": "admin",
        "locationIds": ["loc_demo_01"],
        "primaryLocationId": "loc_demo_01",
        "env": "demo"
      }
    ]
  },
  "error": null,
  "meta": { "requestId": "..." }
}
```

Design constraints:

- **Membership-only gate.** No `requirePermission` beyond "is this user a member." It is
  literally "who am I a member of," derived from `project_members` for the authenticated
  `userId`.
- **`baseUrl` is authoritative.** The app must never construct hosts itself. Foundry owns
  the host↔project mapping so demo/prod/regional hosts can change with no app release.
- **Return `role` + `locationIds` + `primaryLocationId`.** This becomes the source of truth
  and lets the iPad stop hardcoding `publicMetadata.projects.lunettiq`.
- **`env`** (`production` | `demo` | `staging`) drives the iPad's demo indicator strip.
- **Cross-host reachability.** Preferred: serve this from a single platform bootstrap host
  that can see *all* the user's memberships, so the app can call it once before it knows any
  project host. Confirm whether that host exists (see open questions).

Optional, later:

- On a valid JWT whose user is **not** a member of the project for that host, return a
  distinct error code `NOT_A_MEMBER` (vs an auth-expired 401) so the app can distinguish
  "wrong project" from "login expired."

---

## 5. Foundry work items

1. Implement `GET /api/platform/my-projects` per the contract above.
2. Create + seed the `lunettiq-demo` project: host mapping, and add the target staff to
   `project_members` with a role.
3. **Verify the Clerk instance is shared** across `lunettiq` and `lunettiq-demo` (same
   `pk_`). If not, a single login cannot see both and the bootstrap approach must change.
   This is a hard prerequisite — verify first.
4. Confirm a stable **platform bootstrap host** for `my-projects` (or document that the app
   must call a known project host first).
5. (Optional) Add the `NOT_A_MEMBER` error code.

The full agent-ready brief for this is in `02-foundry-agent-prompt.md`.

---

## 6. iPad work items (summary — full detail in `01-ipad-plan.md`)

1. Runtime base URL via a new `useTenantStore` (MMKV), replacing the build-time `BASE_URL`
   constants in `src/api/client.ts` and `src/features/design/DesignTokenProvider.tsx`.
2. Retire the hardcoded `.lunettiq` slug in `src/features/auth/useStaffProfile.ts`.
3. **Per-project WatermelonDB isolation** (DB name per slug). Highest-risk item: today the
   DB is a single global store with no tenant scoping (`src/db/index.ts`,
   `src/sync/useInitialSync.ts`), so an unisolated switch would mix demo and production
   client data.
4. Select-project screen + post-login gate; auto-select when only one project.
5. Switch-store UX in `app/(app)/more/index.tsx`, including unsynced-changes guard,
   query-cache clear, operator + privacy reset.
6. Demo indicator (ModeStrip variant) when `env: 'demo'`.

---

## 7. Ownership matrix

| Item | Owner |
|---|---|
| `GET /api/account/my-projects` (data + host mapping) | Foundry |
| `lunettiq-demo` project + `project_members` seeding | Foundry |
| Shared Clerk instance across projects (verify) | Foundry |
| Platform bootstrap host | Foundry |
| `NOT_A_MEMBER` error code (optional) | Foundry |
| `useTenantStore` + runtime base URL | iPad |
| Retire hardcoded `.lunettiq` slug | iPad |
| Per-project DB isolation (DB factory by slug) | iPad |
| Select-project screen + switch-store UX + demo strip | iPad |
| Cache / operator / privacy reset on switch | iPad |

---

## 8. Sequencing (cross-team)

1. **Foundry:** `my-projects` endpoint + shared-Clerk verification + demo project seeded.
   Gating dependency — nothing on the iPad can be integration-tested without it.
2. **iPad:** runtime base URL + retire hardcoded slug. Low risk; unblocks calling
   `my-projects`.
3. **iPad:** per-project DB isolation (DB singleton → factory-by-slug refactor). The part
   that must not be rushed.
4. **iPad:** select-project + switch UX + demo strip.
5. **Both:** test the two-membership case on a real device — offline sync must survive a
   switch and drain the correct project's queue.

---

## 9. Open questions — RESOLVED (2026-09-28)

1. **Shared Clerk instance?** ✅ **Yes.** One Clerk instance across all projects (single
   `CLERK_SECRET_KEY`, one global user pool). One login sees every project it's a member of.
2. **Bootstrap host?** **Not a neutral host — call `my-projects` on a project host the user
   belongs to.** The mobile-JWT middleware resolves a tenant from the host and returns `403`
   if the JWT user isn't a member of that tenant. Booting from a project the user already
   belongs to passes the gate; the handler then returns *all* their memberships.
   - iPad rule: persist the last-selected `baseUrl` (MMKV). First launch / no stored host →
     default to `https://lunettiq.bentspline.com` (primary project). Call
     `{storedOrDefault}/api/account/my-projects`.
   - Host mapping (Foundry): `custom_domain` if set, else `{slug}.bentspline.com`; dev
     `{slug}.localhost:4000`. `lunettiq` → `lunettiq.bentspline.com`, `lunettiq-demo` →
     `lunettiq-demo.bentspline.com`.
   - A neutral platform host would need a Foundry proxy carve-out (protected-file edit) —
     not done; avoid.
3. **`env` vocabulary?** `production | demo | staging`. Derived from `settings.env` or slug
   suffix. Use `env === 'demo'` to drive the demo indicator strip.

## 10. Foundry outstanding (before production-usable)

1. **Deploy:** branch `feat/my-projects-endpoint` needs push → PR → merge → deploy. Not yet
   on any live host.
2. **HTTP e2e unproven:** verified via direct DB query + mocked route tests; the full
   middleware→handler path over real HTTP with a real JWT hasn't been run. First real curl
   from the iPad closes this.


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

```
GET /api/platform/my-projects
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
| `GET /api/platform/my-projects` (data + host mapping) | Foundry |
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

## 9. Open questions (resolve before coding)

1. Is the Clerk instance genuinely shared across `lunettiq` and `lunettiq-demo` (one `pk_`)?
   If not, the bootstrap approach changes.
2. Is there a stable platform bootstrap host the app can call `my-projects` on before it
   knows any project host? This decides the iPad `PLATFORM_BOOTSTRAP_URL`.
3. Exact `env` value vocabulary (`production` | `demo` | `staging` | other?).

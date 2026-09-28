# iPad-side execution plan — multi-project support

Status: ready to execute (pending Foundry `my-projects` contract lock)
Owner: Lunettiq iPad team
Depends on: `00-shared-plan.md`, Foundry `GET /api/platform/my-projects`

This is the concrete, file-by-file plan for the iPad app. Steps are ordered so each is
shippable and testable on its own.

---

## Current state (verified in code)

- **Base URL is build-time.** A module constant in two files:
  - `src/api/client.ts` — `BASE_URL = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com')`
  - `src/features/design/DesignTokenProvider.tsx` — same constant, used for `/api/design/native`.
- **Tenant slug is hardcoded.** `src/features/auth/useStaffProfile.ts` reads
  `meta?.projects?.lunettiq` (literal). Role + location come from Clerk `publicMetadata`.
- **Offline DB is a single global store.** `src/db/index.ts` builds one `SQLiteAdapter`
  with one DB file, exported as a module singleton. `src/sync/useInitialSync.ts` wipes and
  refills `products` / `appointments` / settings globally — **no tenant scoping, no
  `projectSlug` column**. This is the main isolation risk.
- **Identity headers** in `src/api/client.ts`: `X-Found-Surface: tablet`,
  `Authorization: Bearer <clerk token>`, optional `X-Found-Operator` (PIN quick-switch via
  `src/features/auth/useOperatorStore.ts`). No project header — host is the selector.
- **Auth gate** in `app/_layout.tsx` `InitialLayout`: redirects `(auth)` ↔ `(app)/home`
  on Clerk `isSignedIn`.
- **Sign-out** lives in `app/(app)/more/index.tsx` and `app/(app)/more/settings.tsx`.

---

## Step 1 — `useTenantStore` + runtime base URL

**New file:** `src/features/tenant/useTenantStore.ts` (mirror `useOperatorStore.ts`: Zustand
+ `persist` + MMKV, its own MMKV id `tenant-store`).

```ts
export interface Project {
  slug: string;
  name: string;
  baseUrl: string;
  role: string;
  locationIds: string[];
  primaryLocationId: string | null;
  env: 'production' | 'demo' | 'staging';
  brandMark?: string;
}

interface TenantState {
  activeProject: Project | null;
  knownProjects: Project[];      // from /api/platform/my-projects
  fetchedAt: number | null;
}

interface TenantActions {
  setActiveProject: (p: Project) => void;
  setKnownProjects: (ps: Project[]) => void;
  clearActiveProject: () => void;
}
```

Persist `activeProject` + `knownProjects` (offline relaunch must remember the last project).

**Edit `src/api/client.ts`:**
- Remove the build-time `BASE_URL` const as the source of truth.
- `get baseUrl()` and `request()` read `useTenantStore.getState().activeProject?.baseUrl`,
  falling back to the env default only when no project is active (first boot / dev).
- Leave the `DEV_API_KEY` dev fallback untouched — it is orthogonal and dev-only.

**Edit `src/features/design/DesignTokenProvider.tsx`:**
- Compute `ENDPOINT` from `useTenantStore.getState().activeProject?.baseUrl` at fetch time
  (not a module const), falling back to env default. Add a `refresh()` trigger on project
  change so brand tokens re-fetch when switching.

**New env:** `EXPO_PUBLIC_PLATFORM_BOOTSTRAP_URL` — the host used to call `my-projects`
before any project is active. Add to `.env.example`, `.env.dev`, `.env.prod`. (Do not touch
secrets; this is a plain URL.)

**Risk:** low. Behaviour-preserving when exactly one project resolves.

---

## Step 2 — retire the hardcoded slug

**Edit `src/features/auth/useStaffProfile.ts`:**
- Read `role`, `locationIds`, `primaryLocationId` from
  `useTenantStore.getState().activeProject` when present.
- Fall back to `user.publicMetadata.projects[activeProject.slug]` (dynamic key, not literal
  `lunettiq`) only when the endpoint data is unavailable offline.
- Keep the final fallback (`staffId = userId`, `locationId = null`) for first-run/dev.

**Risk:** low. Same shape out; source changes from Clerk-metadata-only to project-first.

---

## Step 3 — per-project WatermelonDB isolation (highest risk)

Goal: demo and production data can **never** share a SQLite file.

**Refactor `src/db/index.ts` from singleton to factory-by-slug:**
- `getDatabaseFor(slug: string): Database` — constructs a `SQLiteAdapter` with
  `dbName: 'lunettiq-' + slug'` (WatermelonDB supports a `dbName` on the adapter).
- Maintain a small cache `Map<slug, Database>` so re-selecting a project reuses its handle.
- Add `getActiveDatabase()` reading `useTenantStore.getState().activeProject?.slug`.
- `getCollections()` becomes `getCollections(db = getActiveDatabase())`.
- Callers that import the `database` singleton must move to `getActiveDatabase()` /
  `getCollections()`. Audit imports of `@/src/db` (`database`, `getDatabase`) before editing.

**`src/sync/useInitialSync.ts`:** already wipe-and-fill; once it writes to the active
project's DB, isolation is automatic. Verify every `getCollections()` call resolves the
active DB.

**Migrations:** each per-slug DB carries the same schema/migrations — no schema change, just
multiple files.

**Sync queue / photo uploads:** these live in the per-slug DB, so project A's pending queue
survives while operating in project B and drains on switch-back. Confirm
`src/sync/PhotoUploadWorker.ts` and `SyncEngine.ts` resolve the DB via the active project,
not a captured singleton.

**Risk:** high. This is the refactor that must not be rushed. Land it behind the
single-project path first (one project → one DB named `lunettiq-lunettiq`), verify parity
with today, then enable switching.

---

## Step 4 — select-project screen + post-login gate

**New route:** `app/(auth)/select-project.tsx`.

Flow, driven from `app/_layout.tsx` `InitialLayout` (or a dedicated gate component):
1. Clerk sign-in completes → call `GET /api/platform/my-projects` (bootstrap URL, Bearer
   JWT, `X-Found-Surface: tablet`). Store into `useTenantStore.setKnownProjects`.
2. **0 projects** → error state: "Your account isn't a member of any store. Contact your
   manager." No route into `(app)`.
3. **1 project** → `setActiveProject`, skip picker, `router.replace('/(app)/home')`. Keeps
   today's single-tenant UX with zero new friction.
4. **N projects** → route to `/(auth)/select-project`.

**Select-project UI (design-system compliant):**
- List of project cards: name, `role` badge, `env` badge (demo highlighted), location count.
- Cards use `bg-color-bg-surface rounded-lg border border-color-border`, 44pt+ targets,
  one primary action per row.
- On select → `setActiveProject` → open that project's DB (Step 3) → design-token refresh →
  initial sync → `router.replace('/(app)/home')`.
- Handle offline: if `my-projects` fails but `knownProjects` is cached, show cached list.

---

## Step 5 — switch-store UX

**Edit `app/(app)/more/index.tsx`:** add a "Switch store" row near sign-out (only visible
when `knownProjects.length > 1`).

Switch sequence:
1. Open a confirm sheet. If the active project's `sync_queue` / `photo_uploads` is non-empty,
   warn ("You have N unsynced changes") and offer to block until synced or cancel.
2. `queryClient.clear()` (TanStack Query — stale project data must not bleed through).
3. `useOperatorStore` reset (PIN operators are per project) and privacy mode → `staff`.
4. `setActiveProject(target)` → open target DB → design-token refresh → initial sync.
5. `router.replace('/(app)/home')`.

**Risk:** medium. The unsynced-changes guard is the correctness-sensitive part.

---

## Step 6 — demo indicator

**Edit `src/ui/ModeStrip.tsx`** (or add a sibling) to show a persistent marker when
`useTenantStore.getState().activeProject?.env === 'demo'`: a labeled strip ("DEMO — not a
live store") so staff never confuse the demo project with a live client session. Reuse the
existing mode-strip pattern and design tokens; no hardcoded colors.

---

## Build config

- Add `EXPO_PUBLIC_PLATFORM_BOOTSTRAP_URL` to `.env.example` / `.env.dev` / `.env.prod`.
- Per-project `EXPO_PUBLIC_FOUNDRY_BASE_URL` becomes a fallback/default, not the selector.
- **No `app.config.ts` / `eas.json` / `package.json` change** for this (single install,
  multi-project). That is the advantage over shipping a separate demo build. If any of those
  protected files ever need touching, stop and confirm with the owner first.

---

## Test plan

1. Single-project account → app behaves exactly as today (picker skipped).
2. Two-membership account (lunettiq + lunettiq-demo) → picker appears, both selectable.
3. Switch store with pending sync → guard fires, queue drains to the correct project.
4. Offline relaunch → last active project restored from MMKV, cached data intact, no cross-
   project bleed.
5. Demo project → demo strip visible on every screen.
6. `pnpm typecheck` + `pnpm test` clean; run on device with `pnpm ios`.

---

## Suggested PR breakdown

- **PR 1:** `useTenantStore` + runtime base URL (Step 1) + retire slug (Step 2).
- **PR 2:** DB factory-by-slug refactor (Step 3), single-project parity only.
- **PR 3:** select-project gate + screen (Step 4).
- **PR 4:** switch-store UX + demo strip (Steps 5–6).

Update `CHANGELOG.md` per change-tracking rule at the end of each PR.

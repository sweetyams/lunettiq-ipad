# Prompt for the main Foundry agent — review the iPad V2 API branch

Paste everything below the line into a Foundry session opened at `/Users/yann/Development/Foundry/foundry`.

---

You are reviewing work done by another agent for the Lunettiq iPad app (V2). **Review only: do not merge, push, deploy, or write to any database other than `lunettiq-demo`.** Report findings; fix only clear bugs, on the same branch, one commit per fix (allowed scopes, `Co-Authored-By: claude-flow <ruv@ruv.net>`).

## What to review

1. **Branch `fix/ipad-v2-api-gaps`** (worktree `../foundry-ipad-api-gaps`, base `main` @ `5bc1afdcb`), 14 commits:
   - `f64579dec` staff writes resolve canonical customer ids (no more "No name yet" shell customers); `product_interaction.created` carries the canonical `customerId`; `hot-leads/events.ts` maps to real Inngest ids. New helper `src/lib/modules/crm/client-ref.ts`.
   - `5cd8aec4c` `GET /api/admin/prescriptions` honours `customerId`/`clientId` (was returning every Rx in the tenant).
   - `12ebd536f` inventory hold queries: `expires_at IS NULL OR …` was unparenthesised inside `and(...)` and escaped the project filter (5 call sites, incl. stock math); protections list honours `appointmentId`/`customerId`/`referenceId`/`reason`/`itemId`/`locationId`.
   - `bdee8383f` + `d0f0c15da` new `POST /api/clients` (409 DUPLICATE on email/phone unless `force`) and `GET /api/clients/duplicates?firstName&lastName&email&phone` → `{ duplicates }` (route still serves the admin dedup queue without those params).
   - `c1ca0e0cf` + `40a7299bc` new `GET /api/scheduling/roster?date=YYYY-MM-DD[&locationId]` (weekly schedules + date overrides; staff_id matched as `staff.id` or Clerk user id).
   - `0838d18d4` `POST /api/admin/prescriptions` validated (`prescriptionStaffCreateSchema` in factory `beforeCreate`), accepts `customerId`, derives the deprecated `shopifyCustomerId`, forces `status: 'submitted'`.
   - `e9e1937d3` client links: create sets `project_id` (FORCE RLS WITH CHECK rejected every insert), resolves canonical ids, list/delete project-scoped, `linkedClient` name joined; migration `drizzle/tenant/0314_client_links_project_id_backfill.sql` (**not applied**).
   - `a3a3eec09` try-on sessions attribute the PIN operator (`session.clerkUserId`); product interactions now require `org:product_interactions:write`; end-visit persists `orderRef`, `tags`, `sendSummary`, `summaryLanguage`; `tryon_session.completed` carries the canonical id.
   - `f8972a811` `GET /api/scheduling` adds `clientName`/`staffName`; `customerId` filter resolves refs (raw Shopify id was a 500).
   - `fa8217ed4` `GET /api/clients/[id]/prescriptions` paginates via the scoped list.
   - `8c94c2d56` scan resolve returns `productId`/`shopifyProductId`; plain codes try item barcode/SKU before shelves.
   - `be8274cdc` configurator product lookup project-scoped.
2. **Branch `feat/lunettiq-demo-today-seed`** (worktree `../foundry-demo-today`): `scripts/seed-lunettiq-demo-today.ts` staff shifts (Willem Shepherd Mon–Fri; retires duplicate shifts; today-only override for Maya keyed like her schedule rows).
3. **Uncommitted** `../foundry-ipad-api-gaps/scripts/repair-lunettiq-demo-shell-customers.ts` — merges the 4 demo shell customers (21 rows) into Camille Tremblay ×2, Léa Bouchard, Olivier Roy. Review it; **run only `--dry-run`**. The owner decides on `--force`.

## How to check

- Run fresh and show output: `pnpm typecheck` and `pnpm vitest run src/lib/modules/crm src/lib/modules/prescription src/lib/modules/inventory src/lib/modules/scheduling src/lib/modules/wishlist src/lib/modules/hot-leads src/lib/modules/configurator`.
- Per commit, check against the steering rules: handler order (context → module gate → permission → Zod → write + audit → `apiResponse`/`apiError`), every query filters `projectId`, no edits under `src/lib/platform/` (only calls), tests cover 403/400/404/success/audit + cross-project isolation.
- Look hard for: behaviour changes for **other callers** (admin web pages using `/api/admin/prescriptions`, `/api/clients/duplicates`, `/api/inventory/protections`, product interactions now needing a permission — storefront callers?), any place that still passes a canonical id to `resolveOrCreateCustomer({ source: 'shopify', sourceRef })`, the same unparenthesised `OR` pattern elsewhere in `src/lib/modules`, and whether `0314` is safe on every tenant DB.
- Optional live check on `lunettiq-demo` only (read-only queries, or the dev server against demo): admin Rx list for Camille returns 1 row; roster for today lists Isabelle/Julien/Maya working, Willem off; `GET /api/scheduling?date=today` rows have names.

## Known open items (don't fix, just confirm/comment)

- #16 demo lens flow: lunettiq-demo has no configurator flows; the only import path copies production — owner to decide.
- `scripts/import-configurator.ts` on `main` has a hard-coded Neon owner connection string with password (separate task; must be rotated). Don't print it.
- `docs/changelog/entries.json` is rewritten by post-commit hooks and left uncommitted on both branches.

## Report back

A table: commit → verdict (ok / bug / risk) → evidence (test or query output) → fix commit if any. Then: the merge order you'd recommend, anything that needs a migration or deploy step, and the repair script dry-run output.

# Foundry agent prompt — iPad V2 API gaps

Paste the block below into a Foundry session. Evidence: `01-foundry-handoff-hot-leads.md`.

````markdown
You're working in the Foundry repo (/Users/yann/Development/Foundry/foundry). The Lunettiq iPad app (V2) is a staff client of Foundry's API. While rebuilding it, we found Foundry-side bugs and missing endpoints. Full evidence is in:
/Users/yann/Development/Foundry/lunettiq-ipad/docs/v2/01-foundry-handoff-hot-leads.md. Read it first.

Work on a branch off main (e.g. `fix/ipad-v2-api-gaps`), one commit per item. Use Foundry's commit scopes and conventions (.kiro/steering). Add a regression test for every fix. Tenant-scope everything (projectId / ctx.id). Don't touch production data; verify on `lunettiq-demo` only. The iPad already works around most of these, so keep response shapes backward compatible.

## P0 — privacy / data integrity

1. **Prescriptions leak across clients.** `GET /api/admin/prescriptions?clientId=…` (crud-factory `prescriptionHandlers.list`) ignores the filter and returns every Rx in the tenant. Support `customerId`/`clientId` filtering. Also refuse unscoped lists for tablet tokens, or document that they're admin-only.
2. **Inventory holds ignore filters.** `GET /api/inventory/protections` ignores `appointmentId`, `customerId` and `reason`, so every appointment shows every hold. Honour all three.
3. **Hot leads never fire for most clients.** In `src/lib/modules/crm/product-interactions/handlers.ts`, the `product_interaction.created` event sends the raw route `customerId` instead of the resolved `canonicalId`. `hot-leads/jobs.ts` then can't find the customer and skips it (`customer_email_not_found`). This affects every Shopify-imported client in production.
   - **Fix:** emit `customerId: canonicalId, shopifyCustomerId: <raw>`.
   - **Clean-up:** fix the dangling `onProductInteractionCreated` name in `hot-leads/events.ts`.
   - **Test:** a tablet `tried_on` for a client with an email creates exactly one lead; a second one within 30 days is deduped.
4. **Shell "No name yet" customers.** `tryon-sessions` and `product-interactions` call `resolveOrCreateCustomer(..., { source: 'shopify', sourceRef: id })` with a canonical uuid. No identity matches, so a new empty customer is created; lunettiq-demo has 3, one created 2026-10-17.
   - Resolve by `customers.id` first, and fall back to the Shopify ref only if the id isn't a known customer.
   - Find and report the shells (customer_identities with source_type='shopify' and a uuid source_ref); merge or delete them on lunettiq-demo only.

## P1 — missing endpoints the iPad needs

5. **`POST /api/clients`** (org:clients:write). Body: firstName, lastName, email?, phone?, preferredLanguage ('en'|'fr'), notes?. Use resolveOrCreateCustomer plus duplicate guards, and return the client profile shape `GET /api/clients/[id]` returns. Today `/api/clients` is GET-only, so New client on the iPad can never succeed.
6. **`GET /api/clients/duplicates?firstName&lastName&email&phone`** → `{ duplicates: [{ id, firstName, lastName, email, phone, fullName, reason: 'email'|'phone'|'name' }] }`. Phone matching should compare the last 10 digits. The path currently falls into `/api/clients/[id]` with id="duplicates" and returns 500.
7. **Daily staff roster.** `/api/storefront/scheduling/staff?date=` ignores `date` and has no shift times. Add `GET /api/scheduling/roster?date=YYYY-MM-DD[&locationId]` → `[{ staffId, staffName, startTime 'HH:mm', endTime 'HH:mm', locationId }]` from staff_schedules (local tz). Seed shifts for lunettiq-demo (Benjamin Amram, Willem Shepherd) in `scripts/seed-lunettiq-demo-today.ts`. That script is on branch `feat/lunettiq-demo-today-seed` (worktree ../foundry-demo-today); rebase onto it or coordinate.

## P2 — correctness and contract tidy-ups

8. **`POST /api/admin/prescriptions`** inserts the request body raw. Validate with `prescriptionCreateSchema`, and accept `customerId` without requiring the deprecated `shopifyCustomerId` (derive it). The iPad now sends: customerId, shopifyCustomerId, sphereOd…addOs as signed text ('-1.25'), axisOd/axisOs ints, pdType 'single'|'dual', pdSingle | pdRight + pdLeft, prescriptionDate, prescriberName, clinicName, status 'submitted'.
9. **Client links.** `POST /api/clients/[id]/links` doesn't set `projectId`, but `DELETE` filters by it, so new links can't be deleted. Set it on create and backfill nulls. Optionally join the other client's first and last name in GET.
10. **Tablet staff attribution.** `crm_interactions.staff_id` is null for tablet sessions (`handleCreateTryOnSession` reads `session.staffId`, which tablet JWTs don't have). Attribute the PIN-authenticated operator so hot leads route to the right stylist.
11. **End visit.** `handleEndTryOnSession` reads only `outcome` and `notes`. Persist `orderRef` (sale attribution), `tags`, `sendSummary` and `summaryLanguage`, or document that they're ignored.
12. **`GET /api/scheduling`.** Left-join and return `clientName` and `staffName`. The iPad already prefers those fields and does N extra lookups without them.
13. **`GET /api/clients/[id]/prescriptions`.** Caps at 10 rows with no pagination. Add `limit`/`offset`.

## Done when

- Each item has a test.
- `pnpm typecheck` and the test suite pass.
- You've verified on lunettiq-demo:
  - Camille Tremblay sees only her own prescription.
  - A tablet `tried_on` for a Shopify-imported demo client creates a hot lead.
  - `POST /api/clients` then `GET /api/clients/duplicates` finds the new client.
  - The roster returns shifts for today after re-running the today seed.
- You report back a table: item → commit → test → verified (y/n), plus a list of shell customers found and what you did with them.
- You don't merge to main or deploy. Leave the branch for review.
````

# Foundry handoff — in-store try-ons never become hot leads

**From:** iPad team (V2 Sprint 0, task 0.2)
**To:** Foundry agent (`/Users/yann/Development/Foundry/foundry/`)
**Date:** 2026-10-15
**Severity:** High. This blocks the whole Smart Discounts (day 3/7/14) module for every in-store and iPad try-on.

## Symptom

`lunettiq-demo` has `crm_product_interactions` rows with `type='tried_on'`, `source='in_store'` (seeded 2026-09-28), and hot-leads settings are at defaults (`enabled: true`, `sources.inStoreTryOn: true`). Yet `hot_lead_opportunities` is empty. Production `lunettiq` is empty too.

## Root cause

`src/lib/modules/crm/product-interactions/handlers.ts` resolves the canonical customer:

```ts
const { customerId: canonicalId } = await resolveOrCreateCustomer(db, ctx.id, {
  email: null, source: 'shopify', sourceRef: customerId,   // customerId = route param
});
```

It stores `canonicalId` on the row, but emits the **raw route param** in the event:

```ts
inngest.send({ name: 'product_interaction.created', data: { ..., customerId, ... } })
//                                                                ^^^^^^^^^^ e.g. 'demo-5d715705'
```

The hot-leads job (`src/lib/modules/hot-leads/jobs.ts`) then treats that as `customers.id` (a uuid):

- dedup: `eq(hotLeadOpportunities.customerId, customerId)`
- resolve email: `eq(customers.id, customerId)` → no row → returns `{ skipped: true, reason: 'customer_email_not_found' }`
- insert: `customerId` (would also violate the uuid FK)

So every qualifying interaction for a client whose route id is **not** the canonical `customers.id` is silently skipped.

**Verified 2026-10-15 on `lunettiq-demo`:** an iPad visit for Camille Tremblay (route id = canonical uuid `9353ffa0-…`) created hot lead `289d800b-…` (open, cold, 15%, expires Oct 29). The seeded `demo-5d715705`-style refs never do. In production most clients are Shopify-imported, so their route id is the Shopify customer id and **production is still fully affected**.

## Fix requested

In `handlers.ts`, emit the canonical id, and keep the raw ref for anything that needs it:

```ts
data: {
  ...,
  customerId: canonicalId,
  shopifyCustomerId: customerId,
  ...
}
```

Please also:

1. **Event map:** `hot-leads/events.ts` maps `'product_interaction.created': 'onProductInteractionCreated'`, but no function by that name exists. The real consumer is the Inngest function in `jobs.ts`. Fix or remove the dangling name so the manifest doesn't mislead.
2. **Regression test:** a `tried_on` interaction with `source: 'tablet'` for a customer with an email creates one `hot_lead_opportunities` row with the canonical `customer_id`, and a second one within 30 days is deduped.
3. **Backfill (optional):** replay the existing `tried_on` / `liked` interactions in `lunettiq-demo` so the demo has leads at day 3/7/14.

## What the iPad now sends (V2 branch `feat/v2-s0-visit-persistence`)

- `POST /api/clients/{id}/tryon-sessions` when a visit starts (`locationId` from the device pin or `X-Found-Location`, plus `appointmentId` when the visit comes from an appointment).
- `POST /api/clients/{id}/product-interactions` with `type: 'tried_on'`, **`source: 'tablet'`** (previously only `surface: 'tablet'`, which the handler ignores), `sessionId`, `locationId`, for each frame **as it is added**.
- At close: `PATCH /api/clients/{id}/tryon-sessions/{sessionId}` with `framesTried` (verdicts), then `POST …/end` with the outcome, then `liked` / `disliked` interactions for each verdict.

Note: the end-session endpoint receives `sendSummary`, `summaryLanguage`, `tags` and `orderRef`, but `handleEndTryOnSession` only reads `outcome` and `notes`. If any of those should persist (e.g. `orderRef` for attribution), the handler needs to accept them.

## Also seen in the live test

- `crm_interactions.staff_id` is `null` on tablet-created sessions. `handleCreateTryOnSession` reads `(session as any).staffId`, which isn't set for tablet JWTs. The PIN-authenticated operator should be attributed, so hot leads (`assignedStaffId`) route to the stylist who saw the client.

## Also found while seeding the demo (2026-10-15)

- **`GET /api/scheduling` has no client name.** It returns raw rows (`customerId`, `title` = service name). The iPad now looks names up per client (`src/api/appointmentsMapping.ts`). A left join on `customers` returning `clientName` would remove N extra requests per refresh; the iPad already prefers `clientName` when present.
- **Approval status drift in the demo seed** (fixed on Foundry branch `feat/lunettiq-demo-today-seed`): `pending_review` isn't a remote-approval status, so seeded requests never appeared in queues.
- **New seed:** `scripts/seed-lunettiq-demo-today.ts --tenant=lunettiq-demo --force` refreshes the demo's time-sensitive layer around today (also step 8/8 of `seed-lunettiq-demo-all.ts`). Run it before each demo. Branch `feat/lunettiq-demo-today-seed` (worktree `../foundry-demo-today`), not merged.

## Suspected: duplicate "shell" customers from tablet writes (2026-10-16)

The Clients list in `lunettiq-demo` shows two nameless, email-less clients ("No name yet") created on Oct 15, the day of the first iPad visit test. Likely cause: `tryon-sessions` and `product-interactions` call `resolveOrCreateCustomer(..., { source: 'shopify', sourceRef: clientId })`. The iPad passes the **canonical** customer id, not a Shopify id, so no `shopify` identity matches and a new empty customer is created each time.

Couldn't confirm by SQL: the Foundry MCP now refuses tenant queries (`DATABASE_TENANT_URL` not configured). To verify, check `customer_identities` for `source_type='shopify'` rows whose `source_ref` is a uuid. Fix: resolve by canonical id first, and only fall back to the Shopify ref when the id isn't a known `customers.id`.

## Privacy: `/api/admin/prescriptions` ignores `clientId` (2026-10-16)

`GET /api/admin/prescriptions?clientId=…` goes through the generic CRUD factory (`prescriptionHandlers.list`), which only reads `limit`/`offset`/`sort`/`order`. It returns **every prescription in the tenant**. The iPad sent `clientId` and showed 8 prescriptions (other clients' optics, prescriber names) on Camille Tremblay's profile, and offered them in the order summary's Rx picker.

- **iPad fix (done):** `usePrescriptions({ clientId })` now calls the scoped `GET /api/clients/:id/prescriptions` and maps Foundry's row shape (`prescriptionDate`, `prescriberName`, text optics, `status`) in `src/api/prescriptionsMapping.ts`.
- **Foundry ask:** either support `customerId` filtering on the admin list or drop the unscoped list for tablet tokens. Any other client that passes `clientId` there has the same leak.
- Also: the scoped route caps at 10 rows and has no lens type or expiry; the iPad shows "Exam <date>" and the review status instead.

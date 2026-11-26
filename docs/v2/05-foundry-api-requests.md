# Foundry API requests from the gap checklist

**From:** iPad team · **To:** Foundry (`/Users/yann/Development/Foundry/foundry`, `main` at `f4b22a2b9`)
**Date:** 2026-11-24 · **Context:** [06-gap-checklist-plan.md](06-gap-checklist-plan.md)
**Routes** are under `src/app/(project)/api/**`. Responses are `{data, error, meta}`.

Each item says what the iPad does today without it, so nothing here blocks the current build. Priority: **P1** = a shipped iPad feature is degraded without it · **P2** = needed for the next phase · **P3** = later.

---

## 0. Bugs found (fix first)

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 0.1 | **Visit summary email never sends.** `POST /api/clients/{id}/tryon-sessions/{sid}/end` accepts `sendSummary` and `summaryLanguage` and emits `tryon_session.completed`, but no function listens (`event-map.generated.json` → `listeners: []`). | iPad switched "Send a summary" to opening a preloaded message instead. | Either add the listener (summary email with loved frames + photos) or drop the fields so clients don't rely on them. |
| 0.2 | **Approval submit sends nothing.** `remote-approval/handlers/submit.ts` never emits `roa.submitted`, so `roaNotifySubmitted` never runs. | Optician has no notification when an order is sent for approval (checklist asks for it). | Emit `roa.submitted` after insert. |
| 0.3 | **Sign-off doesn't move the order.** Sign-off sets `approvalId`/`opticianId` on the rx order but leaves it in `optician_review`. | Orders stay "Pending approval" after approval. | On sign-off, transition `optician_review → ready_for_lab` with the sign-off credential (same rule as the manual move). |
| 0.4 | **Interaction edit is a 405.** `/api/clients/{id}/interactions/{iid}` exports only `DELETE`; the iPad's `useUpdateInteraction` calls `PATCH`. | Editing a note fails. | Add `PATCH` (body, subject) or tell us to remove edit. |
| 0.5 | (iPad side, fixed) Client edits used `PATCH /api/clients/{id}`; Foundry has `PUT` only. | Contact/tag edits from the iPad failed. | Fixed in the iPad. Optional: accept `PATCH` as an alias, other clients may make the same mistake. |
| 0.6 | **Rx reminders only log.** `sendRxReminders` (daily 9am) writes `reminder_sent` events but sends no SMS/email. | Timeline says "reminder sent" when nothing went out: misleading for staff. | Send through the SMS/email adapters (§5), or rename the event to `reminder_due` until it does. |
| 0.7 | **Stale flags repeat hourly.** `checkStaleOrders` writes a new `anomaly_flagged` "Stale: N+ days in <state>" event every hour for the same order (seen ×9 on one day in lunettiq-demo). | Order timelines fill with duplicates; the iPad now collapses them (`×9`). | Flag once per order per state (dedupe on orderId + state), or update the existing flag's `daysInState`. |

## 1. Discounts off (P1)

The store no longer discounts. The iPad hides every discount, but Foundry still creates a Shopify code for hot leads when `day3EmailEnabled && day14SmsEnabled` (tier `?? 10`), and the day 3/14 emails can carry it.

- Add `HotLeadSettings.discountsEnabled: boolean` (default `true` for other tenants), set `false` for `lunettiq` and `lunettiq-demo`.
- When false: no code generation, no `discountTierAuthorized` on new opportunities, and the Klaviyo events omit the code so the templates fall back to a no-discount version.
- `POST /api/admin/hot-leads/contacts` should ignore `discountOffered` when disabled.

## 2. Orders and lab tracking (P1)

| Ask | Why | iPad today |
|---|---|---|
| **Staff on the order list.** Add `staffName` (who created / sold) to `GET /api/admin/rx-pipeline/orders` rows. | Replaces the Excel tracker's "employee" column. | Tracker shows "—". Reads `staffName ?? createdByName`. |
| **`productionStartedAt`** (when the order had both payment and Rx), or document that `createdAt` is the clock. | 10–12 business-day lead time should start when the job can start, not when an awaiting-Rx order was opened. | Uses `productionStartedAt ?? createdAt`. |
| **Lab confirmed.** `POST /orders/{id}/lab-confirmation {confirmedAt?, labRef?, eta?}` writing `labConfirmedAt` and an event; or write `lab_batches.acknowledgementAt` which exists but is never set. | Checklist: manual lab confirmation that triggers client messages. | Writes a note "Lab confirmed the job" and opens the production-update message. |
| **Delayed flag.** `POST /orders/{id}/delay {reason, newEta?}` → `delayedAt`, `delayReason`, updated `estimatedCompletionDate`, event `delayed`. | "Delayed" is a status the store wants to see in lists. | Writes a note "Delayed: …". |
| **Receiving check result** on single orders (not only batches): `POST /orders/{id}/receiving {passed: boolean, failed: string[], note}`. Missing items → `anomaly_flagged`; failed → existing QC-fail redo move. | Receiving check when the box arrives. | Passed → `ready_for_pickup`; extras missing → note; failed → `received_from_lab → at_lab` (QC fail, increments `redoCount`). |
| **Late orders query.** `GET /orders?late=true` (business days past the lab's lead time) or a `lateness` field on rows. Holidays from a store calendar. | Floor's daily status. | Computes Mon–Fri business days locally against a fixed 10/12 window; ignores holidays and per-lab lead times. |
| **Paid flag.** `paidAt` or `paymentStatus` on rx orders. | Stage is named "Paid, waiting for Rx"; an unpaid awaiting-Rx order would be mislabelled. | Shows deposit / total. |
| **Valid transitions endpoint.** `GET /orders/{id}/transitions` → `[{toState, permission, needsCredential, label}]` from `getValidTransitions`. | So the iPad stops mirroring `rules.ts`. | Hard-coded copy in `src/features/orders/orderActions.ts`. |
| **State filter on list.** Honour `?state=` (and `customerId=`). | Smaller payloads per stage. | Fetches up to 500 and groups locally. |
| **Credential format** for `ready_for_lab → at_lab` / `optician_review → ready_for_lab`. | iPad asks the optician for their OOAQ licence number and sends it as `credential`. | Confirm that's what the rule expects (vs a PIN re-auth token). |
| `leadTimeRules` editable through `labs` POST/PUT. | Per-lab lead times instead of the fixed 10–12. | — |

## 3. Prescriptions (P1 / P2)

| Ask | Priority | Why | iPad today |
|---|---|---|---|
| `/api/rx/scan` returns **`patientName`** (and `expiryDate`, already asked of the model but dropped). | P1 | Checklist: photograph an Rx and use the name to start a profile. | Shows the name if present; otherwise staff type it. |
| **Staff "send upload link".** `POST /orders/{id}/request-rx-upload {channel: sms|email}` using `generateRxUploadToken` (exists, no caller) and the customer `/api/rx/upload-with-token` page. | P2 | Paid-without-Rx reminder at 14 days should contain a link, not "reply with a photo". | Template asks them to reply with a photo or have the optometrist send it. |
| **Prescription inbox matcher**: register a matcher in the `inbox` module for emailed Rx: match by email, then name (fuzzy), return candidates with a score; staff confirm. `GET /api/inbox/rx-candidates`, `POST …/{id}/attach {customerId, rxOrderId?}`. | P2 | Checklist: match emailed prescriptions to a customer, staff verify near matches. | Not built. |
| Confirm `/api/rx/capture` with `auth.type: 'staff'` and `customerId` (no `rxOrderId`) creates the Rx and auto-attaches to all `awaiting_rx` orders. | P1 | The iPad relies on it. | Sends `rxOrderId` when opened from an order. |

## 4. Client file (P2)

| Ask | Why | iPad today |
|---|---|---|
| **Draft customers.** Let `POST /api/clients` accept no name when `draft: true` (store `isDraft`, hide from marketing syncs and Shopify push, auto-archive after N days if never completed). | Walk-in intake with no name or contact. | Creates "Guest · Nov 24 14:05" with tag `draft-profile`; renames on contact capture. Needs cleanup of abandoned guests. |
| **Measurements table** `customer_measurements` (`customerId, takenAt, takenBy, templateId, templateVersion, values jsonb, frameRef`) + `GET/POST /api/clients/{id}/measurements`; and a per-tenant **measurement template** (`GET /api/clients/measurement-template`). | PD/OC/optician/notes as a reusable template for other optical stores; history per client; feeds `rx_orders.measurements`. | Stored on `crm_client_enrichments.customFields.measurements` (newest first, last 20). Shape matches the proposed table for a straight migration. |
| **Handoff** and **frame collection** as first-class fields (or bless `customFields.handoff` / `customFields.collection` as a documented contract). | Shown on profile, visit and follow-ups; other surfaces (web admin) should see them. | `customFields.handoff = {reasons[], when, note, updatedAt, updatedBy}`, `customFields.collection = [{id, role, frame, fromUs}]`. |
| **Enrichment merge.** `PUT /enrichment` replaces `customFields` wholesale. Offer a merge (`PATCH` with deep merge of `customFields`) to avoid two iPads overwriting each other's keys. | Concurrency. | iPad reads, merges and writes the whole object. |
| **Wishlist item tags.** | Wishlist tags (D). | Not built. |

## 5. Messages (P2)

| Ask | Why | iPad today |
|---|---|---|
| **Template API for staff messages:** `GET /api/messages/templates?surface=tablet` → `[{key, channel, subject{en,fr}, body{en,fr}, variables[]}]`, tenant-editable. Keys used by the iPad: `visit_choices, left_empty_handed, shortlist, booked_visit, purchased_thanks, follow_up_check_in, rx_reminder, production_update, job_redo, ready_for_pickup`. | Store owns the wording; no app release to change a sentence. | Templates ship in `src/features/messages/templates.ts` (EN/FR, tested for no discount language). |
| **Send to a customer:** `POST /api/clients/{id}/messages {channel: sms|email, templateKey?, body, subject?, locale, mediaUrls?, context?: {orderId?, opportunityId?, sessionId?}}`. SMS via the Twilio adapter, creating the thread with `getOrCreateThread` (today SMS only posts into an existing thread). Log on the client timeline and, with `context`, on the order / hot lead. Transactional vs marketing flag so CASL consent is checked only for marketing. | One-tap send from visit, follow-ups and orders; real delivery status. | Opens the iPad's Messages/Mail prefilled; staff send; contact logged via hot-leads `contacts` or an order note. |
| **Media in messages**: signed URLs for fitting photos (`photoKeys` on try-on frames) usable in `mediaUrls`. | Send photos of frames after the visit. | Share sheet sends names only. |
| **Scheduled sends**: production update ~7 days after purchase, Rx reminder at 14 days. Jobs exist (`sendRxReminders`) — connect them to the send endpoint. | Soft production update, Rx reminder. | Staff trigger manually from the order. |

## 6. Store traffic (P2, pending decision)

`POST /api/locations/{id}/traffic {at, kind: 'entered'}` and `GET …/traffic?date=` → `{entered, helped}` where `helped` = try-on sessions started that day. Keep both counts until the store decides which one it reports.

iPad today: counts on the device per store and day (`useWalkInCounter`), helped = visits started on that iPad. Lost if the iPad is reset; not shared across iPads.

## 7. Hot leads (P2)

- `GET /api/admin/hot-leads/queue` rows: add `lastSession {startedAt, notes, framesTried[{productId, title, verdict}]}` so the follow-up card doesn't need two extra calls (iPad currently reads try-on sessions + product interactions).
- `stats.recoveredRevenue` is always 0 (TODO in Foundry).

## 8. Receipts at close (P2)

Insurance receipts are created from `orders` (`POST /api/admin/orders/{orderId}/receipt`), not `rx_orders`. Allow creating a receipt for an rx order (or link the rx order to its sales order) so the visit close can offer *Send now / Schedule for… / Print* using the existing `/schedule` and `/send`.

## 9. Not asked (decisions pending)

Scheduled invoices / pre-orders (grey area), lab EDI sync (lab cooperation), try-on video, remote measurements.

## 10. Found in the 2026-11-26 app review

The iPad now works around the first four; the rest need Foundry.

| # | Request | Why |
|---|---|---|
| 10.1 | `GET /api/storefront/products` should read `q` (and `stock`) | It ignores both, so every search returned the whole catalogue. The iPad now searches on the device. |
| 10.2 | `GET /api/clients/{id}/interactions` should return `{ interactions, total }` or document the array | The iPad read `.interactions` and every history looked empty. It now accepts both shapes. |
| 10.3 | Wishlist rows and `product-interactions` should join the product (title, price, image) | Rows carry only ids. The iPad now names them from its catalogue. |
| 10.4 | Rx order create should take a `tryonSessionId` column | The iPad puts it in `lensSpec` for now. |
| 10.5 | `PUT /api/clients/{id}/preferences` should save (handler is a TODO that only audits) | Saving preferences shows success and changes nothing. |
| 10.6 | Second Sight and custom-design create should fill `customerId` / `canonicalCustomerId` from `clientId`; add `PATCH` or document `POST [id]/grade` and `[id]/credit` | Both inserts fail on NOT NULL columns; the iPad's grade/credit paths don't exist. |
| 10.7 | Multi-pair: `recommend` routes any request with `customerId` to history; accept needs `acceptedPairIndices`; questionnaire returns one object; insurance expects `annualAllowance` | The feature is broken end to end on the iPad. Needs an agreed contract before the iPad is changed. |
| 10.8 | Let store staff (`:call`) set a follow-up's status, or give the iPad a staff-level endpoint | `PATCH /admin/hot-leads/{id}` needs `org:hot_leads:manage` (manager). The iPad now warns instead of claiming success. |
| 10.9 | Appointment ranges: accept `dateFrom`/`dateTo` with the tenant's timezone | Sent without an offset, read as server time; the week view may drift 4–5 hours. |
| 10.10 | Allow `no_show` from `scheduled` | Marking an unconfirmed appointment no-show returns 422. |

iPad-side items still open from the review (not Foundry): an approval detail screen (sign off / reject / return — claiming a request currently leads nowhere), permissions after a staff PIN switch (they follow the device owner, not the person who unlocked), and Face ID's passcode fallback unlocking as the owner.

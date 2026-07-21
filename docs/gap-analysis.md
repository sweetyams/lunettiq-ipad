# Foundry ↔ iPad App — Gap Analysis

**Generated:** 2026-07-21
**Scope:** All Foundry API modules vs. iPad app implementation status
**Method:** Cross-reference of Foundry platform module inventory against iPad codebase implementation inventory

---

## Executive Summary

The iPad app has **solid coverage of the core consultation flow** (Phases 1–4 complete). The primary gaps fall into two categories:

1. **Critical infrastructure gap:** Offline sync is structurally built but not wired — the app cannot function offline today.
2. **Missing optical workflow modules:** Rx Pipeline, Rx Approvals, Multi-Pair, Loyalty, and Configurator are entirely absent. These are daily-use features for Lunettiq SAs.

Of the 16 Foundry module groups in the API contract, **7 are fully implemented**, **2 are partially implemented**, and **7 are missing entirely**.

---

## Status Overview

| Module | iPad Status | Priority | Phase |
|--------|-------------|----------|-------|
| Clients | ✅ Implemented | — | Done |
| Products (storefront) | ✅ Implemented | — | Done |
| Appointments | ✅ Implemented | — | Done |
| Media (photo upload) | ✅ Implemented | — | Done |
| Second Sight | ✅ Implemented | — | Done |
| Custom Designs | ✅ Implemented | — | Done |
| Inventory | ⚠️ Partial | High | 5 |
| Settings & Taxonomy | ⚠️ Partial | Medium | 5 |
| Offline Sync (WatermelonDB) | ⚠️ Structural only | **Critical** | 5 |
| Push Notifications | ❌ Missing | High | 5 |
| Loyalty Credits | ❌ Missing | High | 6 |
| Rx Pipeline | ❌ Missing | High | 6 |
| Rx Approvals | ❌ Missing | High | 6 |
| Prescriptions | ❌ Missing | Medium | 6 |
| Multi-Pair Recommendations | ❌ Missing | Medium | 6 |
| Insurance Receipts | ❌ Missing | Medium | 6 |
| Configurator | ❌ Missing | Low | 7 |

---

## Priority 1 — CRITICAL (Blocks Production Use)

### 1.1 Offline Sync — Wire WatermelonDB Read/Write

**Status:** ⚠️ Structural but NOT functional

**Gap:** WatermelonDB schema (7 tables), models, SyncEngine, and PhotoUploadWorker all exist as code. However:
- `useInitialSync` fetches from API but does NOT call `database.write()` to persist locally
- No read-fallback logic exists (when offline, TanStack Query just fails)
- The sync queue (`sync_queue` table) is defined but writes are never enqueued
- Photo uploads queue to `photo_uploads` table but the worker isn't triggered on reconnect

**Relevance:** ESSENTIAL — The app's #2 principle is "Offline-first." Without this, an SA loses all data the moment WiFi drops in-store. Core flows (session, fitting, interactions) must work offline.

**Implementation:**
1. Wire `useInitialSync.ts` to call `database.write()` for products, clients, appointments
2. Create `useOfflineFallback` hook pattern: TanStack Query → on network error → read from WatermelonDB
3. Wire mutation hooks to enqueue to `sync_queue` when `isOnline === false`
4. Connect `SyncEngine.drain()` to network reconnect event in `SyncProvider`
5. Connect `PhotoUploadWorker.processQueue()` to WiFi reconnect
6. Add `lastSyncedAt` tracking per entity type for incremental sync

**Effort:** 3–5 days (infrastructure is built, needs wiring + testing)

---

### 1.2 Push Notifications — Token Registration

**Status:** ❌ Missing

**Gap:** No `useRegisterPush` hook, no Expo push token acquisition, no registration call to `POST /api/admin/push/register`. The endpoint is documented in the API contract as idempotent (call on every login).

**Relevance:** ESSENTIAL — Push notifications are the only way the store can alert an SA about: appointment arrivals, Rx approvals ready, inventory holds expiring, client check-ins. Without this, the iPad is passive.

**Implementation:**
1. Create `src/api/usePushRegistration.ts`:
   ```typescript
   // On successful auth:
   // 1. Get Expo push token via expo-notifications
   // 2. POST /api/admin/push/register { token, platform: 'ios', deviceName }
   // On logout: DELETE /api/admin/push/register
   ```
2. Add `expo-notifications` dependency
3. Wire registration into `AuthProvider` (call after successful biometric/login)
4. Wire deregistration into sign-out flow
5. Handle incoming notifications (foreground: toast, background: badge count)
6. Request notification permissions at appropriate moment (not on first launch)

**Effort:** 1–2 days

---

## Priority 2 — HIGH (Core SA Daily Workflow)

### 2.1 Loyalty Credits — Balance & Issuance

**Status:** ❌ Missing

**Gap:** No API hooks, no UI for viewing credit balance or issuing credits. The client profile screen shows client data but not loyalty information.

**Relevance:** ESSENTIAL — SAs issue courtesy credits, apply trade-in credits (from Second Sight), and check balances during every consultation. The Second Sight flow already calculates credit amounts but has nowhere to issue them.

**Implementation:**
1. Create `src/api/useLoyalty.ts`:
   - `useLoyaltyBalance(customerId)` → `GET /api/loyalty/credits/{customerId}`
   - `useIssueLoyaltyCredit()` → `POST /api/loyalty/credits/{customerId}`
2. Add LoyaltyCard component to client profile (balance display + ledger)
3. Add "Issue credit" action (amount, reason, type fields)
4. Wire Second Sight's credit decision step to actually call the loyalty endpoint
5. Privacy mode: show "Credits available" (not dollar amount) in client-visible mode

**Effort:** 2–3 days

---

### 2.2 Rx Pipeline — Order Tracking

**Status:** ❌ Missing

**Gap:** No hooks, no screens, no types for Rx pipeline. This is the state machine that tracks a prescription order from submission through lab processing to client pickup.

**Relevance:** ESSENTIAL — SAs check Rx order status multiple times daily ("Where are Marie's glasses?"). The pipeline view answers this instantly. States: `awaiting_rx → ordered → in_lab → ready → picked_up`.

**Implementation:**
1. Create `src/api/useRxPipeline.ts`:
   - `useRxPipelineOrders(params)` → `GET /api/admin/rx-pipeline/orders`
   - `useRxPipelineOrder(id)` → `GET /api/admin/rx-pipeline/orders/{id}`
   - `useRxPipelineCounts()` → `GET /api/admin/rx-pipeline/counts`
   - `useUpdateRxOrder()` → `PATCH /api/admin/rx-pipeline/orders/{id}`
   - `useCreateRxOrder()` → `POST /api/admin/rx-pipeline/orders`
2. Create types in `src/api/rx-pipeline.types.ts`
3. Add screen: `app/(app)/more/rx-pipeline.tsx` — list view with state filters
4. Add pipeline counts badge to Home screen (quick-glance widget)
5. Add "Rx status" section to client profile (client's active orders)
6. Consider: Kanban-style board vs. filtered list (list is simpler for V1)

**Effort:** 3–4 days

---

### 2.3 Rx Approvals — Review Workflow

**Status:** ❌ Missing

**Gap:** No hooks, no screens, no types. This is the approval workflow where an optician reviews and signs off on prescription orders before they go to the lab.

**Relevance:** HIGH — Not every SA does approvals (requires `org:rx:verify` or `org:rx:sign_off` permission), but those who do need it on the iPad. The approval queue, claim/release flow, and sign-off with credentials are all tablet-appropriate workflows.

**Implementation:**
1. Create `src/api/useRxApprovals.ts`:
   - `useRxApprovalQueue(status)` → `GET /api/admin/rx-approvals?status=submitted`
   - `useRxApprovalSummary()` → `GET /api/admin/rx-approvals/summary`
   - `useRxApproval(id)` → `GET /api/admin/rx-approvals/{id}`
   - `useClaimApproval()` → `POST /api/admin/rx-approvals/{id}/claim`
   - `useReleaseApproval()` → `POST /api/admin/rx-approvals/{id}/release`
   - `useSignOff()` → `POST /api/admin/rx-approvals/{id}/sign-off`
   - `useReturnApproval()` → `POST /api/admin/rx-approvals/{id}/return`
   - `useRejectApproval()` → `POST /api/admin/rx-approvals/{id}/reject`
   - `useSubmitCorrections()` → `POST /api/admin/rx-approvals/{id}/corrections`
   - `useApprovalHeartbeat()` → `POST /api/admin/rx-approvals/{id}/heartbeat`
   - `useReadinessCheck(orderId)` → `GET /api/admin/rx-approvals/readiness?orderId={id}`
2. Create types for the state machine: `draft → submitted → in_review → approved/rejected/returned`
3. Add screens:
   - `app/(app)/more/rx-approvals.tsx` — queue list with status tabs
   - Approval detail view (sheet or full screen) with Rx snapshot, checklist, action buttons
4. Implement heartbeat (keep-alive while reviewing — interval POST every 30s)
5. Role-gate: only show in nav if user has `org:rx:verify` permission
6. Add badge count to More tab when pending approvals exist

**Effort:** 5–7 days (complex state machine + credential handling)

---

### 2.4 Inventory — Full Integration

**Status:** ⚠️ Partially implemented

**Gap:** The app fetches inventory for display (stock dots on ProductCard, ActiveHoldsCard on Home) but is missing:
- `POST /api/inventory/protections` — creating holds (shortlist → 48h hold)
- `PUT /api/inventory/protections/{id}` — extending holds
- `DELETE /api/inventory/protections/{id}` — releasing holds
- `POST /api/inventory/scan/resolve` — barcode → product resolution (BarcodeScanner exists but may not use this endpoint)

**Relevance:** ESSENTIAL — The shortlist feature in fitting mode is supposed to create a 48-hour inventory hold. Without the create/release endpoints wired, shortlisting is cosmetic only.

**Implementation:**
1. Add to existing inventory hooks or create `src/api/useInventoryProtections.ts`:
   - `useCreateProtection()` → `POST /api/inventory/protections`
   - `useExtendProtection()` → `PUT /api/inventory/protections/{id}`
   - `useReleaseProtection()` → `DELETE /api/inventory/protections/{id}`
2. Wire "Shortlist" action in fitting mode to create a `try_on_hold` protection
3. Wire barcode scanner's resolve step to `POST /api/inventory/scan/resolve`
4. Add hold expiry display to ActiveHoldsCard ("Expires Thu 14:00")
5. Add "Release hold" action to hold cards

**Effort:** 2 days

---

## Priority 3 — MEDIUM (Enhances SA Workflow)

### 3.1 Prescriptions — CRUD

**Status:** ❌ Missing (display exists on client profile, but no write operations)

**Gap:** The client profile screen shows prescriptions via `GET /api/clients/{id}/prescriptions`, but there are no hooks for:
- `POST /api/admin/prescriptions` — create new Rx record
- `PATCH /api/admin/prescriptions/{id}` — update/verify
- `GET /api/admin/prescriptions/{id}` — full detail view

**Relevance:** USEFUL — SAs don't typically create prescriptions (optometrists do), but they need to view details and occasionally update verification status. Full CRUD is more of a manager/optician feature.

**Implementation:**
1. Create `src/api/usePrescriptions.ts`:
   - `usePrescription(id)` → detail view
   - `useCreatePrescription()` → for intake flow
   - `useUpdatePrescription()` → for verification
2. Add prescription detail sheet (tap from client profile's Rx list)
3. Add "New prescription" action (role-gated to `org:prescriptions:write`)
4. Consider: prescription entry is data-heavy (sphere, cylinder, axis, add, PD per eye) — optimize for iPad keyboard/number pad

**Effort:** 3–4 days

---

### 3.2 Multi-Pair Recommendations

**Status:** ❌ Missing

**Gap:** No hooks, no screens. Multi-pair is the workflow where an SA recommends multiple frames (e.g., everyday + computer + sun) based on lifestyle questionnaire and insurance coverage.

**Relevance:** USEFUL — This is a sales tool that drives AOV. The recommendation engine lives server-side; the iPad just needs to present questionnaire, display recommendations, and let SA accept/modify.

**Implementation:**
1. Create `src/api/useMultiPair.ts`:
   - `useMultiPairRecommendations(customerId)` → `GET /api/admin/multi-pair/recommend?customerId={id}`
   - `useAcceptRecommendation()` → `POST /api/admin/multi-pair/accept`
   - `useMultiPairQuestionnaire(customerId)` → `GET /api/admin/multi-pair/questionnaires?customerId={id}`
   - `useSaveQuestionnaire()` → `POST /api/admin/multi-pair/questionnaires`
   - `useInsuranceProfile(customerId)` → `GET /api/admin/multi-pair/insurance?customerId={id}`
   - `useSaveInsurance()` → `POST /api/admin/multi-pair/insurance`
2. Add Multi-Pair entry point to session workspace (action button)
3. Create questionnaire UI (lifestyle questions — mostly tap-to-select)
4. Create recommendation display (product cards with rationale)
5. Wire accepted recommendations to wishlist groups

**Effort:** 4–5 days

---

### 3.3 Insurance Receipts

**Status:** ❌ Missing

**Gap:** No hooks, no screens. Insurance receipts are PDF documents generated for clients to submit to their insurance provider for reimbursement.

**Relevance:** USEFUL — SAs generate and email these during checkout or post-sale. Common request: "Can you resend my receipt?"

**Implementation:**
1. Create `src/api/useReceipts.ts`:
   - `useReceipts(customerId)` → `GET /api/admin/receipts?customerId={id}`
   - `useReceipt(id)` → `GET /api/admin/receipts/{id}` (includes signed PDF URL)
   - `useSendReceipt()` → `POST /api/admin/receipts/{id}/send`
   - `useRegenerateReceipt()` → `POST /api/admin/receipts/{id}/regenerate`
2. Add receipts section to client profile (list + actions)
3. Add "Email receipt" action with confirmation toast
4. PDF viewing: open signed URL in system browser or in-app WebView

**Effort:** 2 days

---

### 3.4 Settings Screen

**Status:** ❌ Not built (menu item exists, no route/screen)

**Gap:** The More tab shows "Settings" but there's no corresponding screen. Device configuration (location, upload preferences, sync settings) exists in WatermelonDB `device_config` table but has no UI.

**Relevance:** USEFUL — Manager-only screen for device configuration, sync status detail, cache management, staff profile view.

**Implementation:**
1. Create `app/(app)/more/settings.tsx`
2. Sections:
   - Device: location assignment, upload-on-cellular toggle
   - Sync: last sync times, force full sync, cache size, clear cache
   - Account: staff profile, permissions display, sign out
   - About: app version, build number, environment
3. Role-gate: only accessible in staff mode, manager+ for some settings
4. Wire to `DeviceConfig` WatermelonDB model for persistence

**Effort:** 2 days

---

## Priority 4 — LOW (Nice-to-Have / Future)

### 4.1 Configurator — Lens Selection

**Status:** ❌ Missing

**Gap:** No hooks or screens for the configurator. This is the lens/treatment selection flow when building a complete eyewear order (frame + lenses + coatings + tints).

**Relevance:** NICE-TO-HAVE for V1 — The configurator is primarily used during the ordering step, which currently happens on the web POS. If the iPad eventually handles full order creation, the configurator becomes essential. For V1 where the iPad is consultation-focused, it's informational only.

**Implementation (when needed):**
1. Create `src/api/useConfigurator.ts`:
   - `useConfiguratorResolve(productId)` → resolve available lens options for a frame
   - `useLensColours()` → available lens colours
   - `useConfiguratorSnapshot()` → saved configuration
2. Add configurator sheet accessible from product detail ("Configure lenses")
3. Step-through UI: lens type → coating → tint → colour → summary
4. Read-only for V1 (shows what's possible); write for V2 (creates order)

**Effort:** 5–7 days (complex multi-step flow with conditional logic)

---

### 4.2 Discovery Mode

**Status:** ❌ Empty directory (`src/features/discovery/`)

**Gap:** The spec mentions Discovery as a "walk-in browsing, no identified client" mode. The product browser works without a session, but there's no dedicated discovery flow that later transitions to session when a client is identified.

**Relevance:** NICE-TO-HAVE — The app already handles the no-session product browsing case. Discovery mode would add: product event tracking for anonymous visitors, transition prompts ("Want to start a session?"), and post-discovery client creation.

**Implementation:**
1. Create `src/features/discovery/useDiscoveryStore.ts` — tracks anonymous product interactions
2. Add transition prompt: after N products viewed, suggest "Create client" or "Search existing"
3. On client identification: migrate anonymous interactions to client record
4. Wire to `POST /api/beacon/product-event` for anonymous analytics

**Effort:** 2–3 days

---

### 4.3 AI Stylist — Enhanced Integration

**Status:** ⚠️ Partially implemented

**Gap:** The API hook `useSuggestions` exists and fetches scored recommendations. The `POST /api/clients/{id}/ai-styler` endpoint is referenced in the session workspace spec. However, the on-demand AI stylist interaction (thought + chips pattern) is not built as a conversational UI.

**Relevance:** NICE-TO-HAVE for V1 — Suggestions already work via scoring. The conversational AI stylist ("Show me frames for someone who likes minimalist design and has a round face") is a differentiator but not blocking.

**Implementation:**
1. Create `src/api/useAiStylist.ts` → `POST /api/clients/{id}/ai-styler`
2. Add chat-like UI component in session workspace (expandable panel)
3. Display: thought bubble + chip suggestions (tap chip → execute as filter/action)
4. Stream response handling if Foundry supports SSE

**Effort:** 3–4 days

---

## Priority 5 — NOT APPLICABLE (to iPad Surface)

These Foundry modules exist but are irrelevant to the iPad app:

| Module | Reason |
|--------|--------|
| Hot Leads | Web-based lead management, not in-store |
| Email Flows | Backend automation, no SA-facing UI needed |
| Content/CMS | Website content management |
| SEO | Website only |
| Domains/Redirects | Website infrastructure |
| Newsletter | Consumer-facing signup |
| Fulfillment/Delivery | E-commerce fulfillment |
| Checkout | Online checkout flow |
| Square/Klaviyo/Brightpearl/Packiyo/Bill.com | Backend integrations, no iPad surface |
| Builder/Sections | Website page builder |
| Typography/Design System | Foundry admin design tools |
| Figma Builder | Design tool integration |
| Background Generator | Website visual tools |
| Financial Analytics | Manager dashboard (web) |
| Dashboard Widgets | Web admin dashboard |
| Cake/Catering/Menus | Other tenant features (Rhubarbe, Sonbon) |
| League Apps | Other tenant feature (Jump) |
| Flavour Archive/Ingredients | Other tenant features |
| SKU Master | Bulk data management (web) |
| Purchasing/POs | Back-office procurement |
| Tax Rules | Configuration (web admin) |
| API Debug | Developer tool |

---

## Infrastructure Gaps (Cross-Cutting)

### I1. Camera ↔ Fitting Screen Integration

**Status:** ⚠️ Components exist but aren't connected

**Gap:** `CaptureView.tsx` (camera component) is built and tested, but the fitting screen (`app/(app)/clients/[id]/fitting.tsx`) uses a placeholder instead of rendering the actual CaptureView. The component exists; it just needs to be imported and wired.

**Effort:** 0.5 days

---

### I2. Idempotency Keys for Offline Queue

**Status:** ⚠️ Schema has `idempotency_key` column, not wired

**Gap:** The `sync_queue` table has an `idempotency_key` field, and the API contract documents idempotency support for specific endpoints. But the mutation hooks don't generate or attach idempotency keys, and the SyncEngine doesn't include the `Idempotency-Key` header when draining.

**Implementation:**
1. Generate UUID for each queued write (already in schema)
2. Include `Idempotency-Key: {uuid}` header in SyncEngine's drain requests
3. Handle `X-Idempotent-Replay: true` response header (log, don't re-process)

**Effort:** 0.5 days

---

### I3. Permission-Based UI Gating

**Status:** ❌ Not implemented

**Gap:** The app shows all features to all users regardless of their Clerk permissions. The API contract defines granular permissions (`org:rx:verify`, `org:rx:sign_off`, `org:multi_pair:recommend`, etc.). Role-inappropriate screens should be hidden or show "Permission denied."

**Implementation:**
1. Fetch user permissions from Clerk session (available in JWT claims)
2. Create `usePermissions()` hook that parses the JWT
3. Create `<PermissionGate permission="org:rx:verify">` component
4. Gate navigation items (hide tabs/menu items user can't access)
5. Gate action buttons (disable or hide based on permission)

**Effort:** 2 days

---

### I4. Location-Scoped Inventory Queries

**Status:** ⚠️ Partial

**Gap:** The API contract states "iPad's location is resolved server-side from staff profile" and "for inventory queries that accept `locationId`, pass it from locally-stored staff config." The `device_config` table has a `location_id` field but it's unclear if inventory queries pass it.

**Implementation:**
1. Populate `location_id` in DeviceConfig on login (from staff profile or settings endpoint)
2. Pass `locationId` parameter to inventory queries
3. Display current location in settings screen

**Effort:** 0.5 days

---

## Recommended Implementation Order

### Phase 5 (Current — Offline + Polish) — 2–3 weeks

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Wire offline sync (1.1) | 5 days | Unblocks production use |
| 2 | Push notifications (1.2) | 2 days | Real-time awareness |
| 3 | Inventory protections (2.4) | 2 days | Shortlist creates real holds |
| 4 | Camera ↔ Fitting wiring (I1) | 0.5 days | Completes fitting flow |
| 5 | Idempotency keys (I2) | 0.5 days | Safe offline retries |
| 6 | Permission gating (I3) | 2 days | Role-appropriate UI |
| 7 | Settings screen (3.4) | 2 days | Device management |

### Phase 6 (Optical Workflows) — 3–4 weeks

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Loyalty credits (2.1) | 3 days | Completes Second Sight flow |
| 2 | Rx Pipeline (2.2) | 4 days | Order status tracking |
| 3 | Rx Approvals (2.3) | 7 days | Optician workflow |
| 4 | Prescriptions CRUD (3.1) | 4 days | Rx record management |
| 5 | Multi-Pair (3.2) | 5 days | Sales tool |
| 6 | Insurance Receipts (3.3) | 2 days | Post-sale service |

### Phase 7 (Enhancement) — 2–3 weeks

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Configurator (4.1) | 7 days | Full order building |
| 2 | Discovery mode (4.2) | 3 days | Anonymous tracking |
| 3 | AI Stylist conversational (4.3) | 4 days | Differentiator |

---

## Metrics

| Metric | Current | After Phase 5 | After Phase 6 | After Phase 7 |
|--------|---------|---------------|---------------|---------------|
| Modules implemented | 7/16 | 9/16 | 15/16 | 16/16 |
| V1 screens built | 21/28 | 23/28 | 28/28 | 28/28 |
| Offline capable | ❌ | ✅ | ✅ | ✅ |
| Push notifications | ❌ | ✅ | ✅ | ✅ |
| Rx workflow coverage | 0% | 0% | 100% | 100% |
| Production-ready | ❌ | ⚠️ (consultation only) | ✅ | ✅ |

---

## Key Decision Points

1. **Rx Approvals on iPad vs. Web:** The approval workflow is complex (heartbeat, credentials, anomaly detection). Decide: full parity with web, or read-only queue + approve action only?

2. **Configurator scope:** Does the iPad need full order creation (configurator required), or does ordering stay on web POS (configurator informational only)?

3. **Multi-Pair timing:** Multi-pair drives AOV but requires insurance data entry. Should this be Phase 6 or deferred until the ordering question is resolved?

4. **Offline write scope:** Which writes truly need offline support? Current spec says "new client creation blocks" (requires duplicate check). Should Rx operations also block offline?

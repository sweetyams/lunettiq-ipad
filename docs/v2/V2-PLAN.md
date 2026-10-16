# Lunettiq iPad V2 — The Floor App for the Optician Operating System

**Date:** 2026-10-15
**Inputs:** *DREAM OPTICIAN APP* pitch deck v2.0 (Apr 29 2026), this repo at `b8b3f32`, Foundry `main` at `b0a2e9ef6`, live data in the `lunettiq` and `lunettiq-demo` tenants.
**Status:** Proposal. Nothing in this plan has been built yet.

---

## 1. The vision, seen from the floor

The deck's thesis is that every optical platform is built for the doctor, and Lunettiq is built for the optician. Opticians are the people who close the sale, chase the lab and remember the client. Most of that thesis lives on the shop floor, and the iPad is the only part of the system that is physically there. Foundry is the brain. The iPad has to be the hands.

The iPad has four users. V2 is designed around each of them.

| Who | Where they are | What they need from the iPad | What they can never do |
|---|---|---|---|
| **Léa, stylist** (not licensed) | On the floor with the client, standing, iPad in hand | Welcome, build the file in under 60 s, run the questionnaire, pick frames, take measurements and photos, build the quote, take the deposit, submit for review | Dispense, or release an order to the lab (OOAQ reserved acts) |
| **Karim, licensed optician** (OOAQ #) | In store, in another store, or at home | A review inbox across stores: verify the Rx interpretation and the measurements against the frame, correct, then sign off with his credential (about 3 min per order) | Sign off without a meaningful review: under-30-second reviews and anomalies get flagged |
| **Marie, client** | Looking at the same screen as Léa | To see herself in the frames, understand her options and price without mental math, and leave knowing what happens next | See LTV, internal tags, discount authority or private notes (privacy mode) |
| **Owner / manager** | Back office or on the floor between clients | Today's numbers (pairs per visit, conversion, recovered revenue), the call queue, dead stock, OD referrers | — |

### A day with V2

1. **09:45 · Opening.** Léa unlocks with her PIN. **Floor** shows 6 appointments, 2 orders *Ready for pickup* (balance owing $180), 3 *Awaiting Rx* reminders queued, and 4 day-7 calls (*Lucas Martin, Ray-Ban Aviator, opened the email twice, 10% authorized*).
2. **10:05 · Walk-in.** A new client. **Quick-build:** name, phone, and a photo of her paper Rx. OCR fills OD/OS (with an "AI was used here" label and consent). The file is done in 50 seconds.
3. **10:08 · Lifestyle.** Léa hands the iPad to the client (handed mode). Six big tap cards: driving, screens 6h+, sport, glare. No keyboard.
4. **10:12 · Frames.** The AI stylist ranks 12 frames that are **in stock in this store** by face shape, Rx and budget. Each frame she tries is photographed. Each photo is a try-on record on the server, with a verdict: love, maybe, or no.
5. **10:30 · Quote.** Frame + lens + add-ons (AR, blue light, photochromic) with a running total, TPS and TVQ, and insurance applied: *"$200 SunLife allowance unused, expires Dec 31."* Multi-pair offers *Polarized Rx sun 92% · Computer pair 78%*. One tap adds the bundle.
6. **10:38 · Close.** Three outcomes, each a first-class path:
   - **Bought.** Deposit taken, order staged, "Submit for optician review". The receipt is sent now, scheduled for Jan 2, or printed.
   - **Bought, but no current Rx.** Status *Awaiting Rx*, lab dispatch blocked, the OD direct-upload link is texted, and the day 3/7/14 cadence starts.
   - **Didn't buy.** The try-on context is saved and becomes a hot lead. The win-back sequence starts on its own.
7. **10:39 · Elsewhere.** Karim's iPad in another store buzzes: *Sofia Patel · Store Plateau · Tom Ford TF5634*. He opens it, sees the Rx, the PD/seg height, frame photos and Léa's notes, and signs off. The lab is unlocked and Léa gets a notification.
8. **17:30 · Close of day.** The manager sees: pairs per visit 1.9, try-on conversion 81%, $640 recovered from the call queue today, and Gucci GG0027O dead for 124 days.

That is the product. Everything below is how we get there.

---

## 2. Where we actually are

### 2.1 The app runs, but the engines get no input

- Builds and runs on the iPad Pro 13 simulator. Typecheck is clean and 33/33 tests pass.
- ~37k lines, 27 screens, 160+ components. The surface area is large.
- **Foundry already has most of the deck's backend:**

| Deck module | Foundry backend | iPad V1 | Production data |
|---|---|---|---|
| Client files / quick-build | `crm` ✅, Rx OCR `/api/rx/scan` (Anthropic Vision) ✅ | Client CRUD ✅; **no Rx capture/OCR** | `prescriptions`: **0** |
| Smart Discounts (D3/D7/D14) | `hot-leads` module ✅ (queue, stats, contacts, single-use Shopify codes, cron) | **Nothing**. No call queue UI | `hot_lead_opportunities`: **0** |
| Try-on capture (feeds the above) | `tryon-sessions` and `product_interaction.created` → hot-leads ✅ | **Broken**: see 2.2 | `crm_try_on_sessions`: **0**, `crm_product_interactions`: **0** |
| Multi-pair engine | `multi-pair` ✅ (recommend, accept, insurance, questionnaires) | Results sheet ✅; **`useAcceptRecommendation` never called** | `pair_recommendations`: **0** |
| Smart upsell / add-ons | `configurator` ✅ | ConfiguratorSheet ✅; no running-total quote | — |
| Insurance receipts (send / schedule / print) | `insurance-receipts` ✅ incl. `/schedule`, `/cancel-schedule` | List + send in profile only; **no schedule** | `insurance_receipts`: **0** |
| Waiting-for-Rx pipeline | `rx-operations` ✅ 12 states incl. `awaiting_rx`, deposits, labs, batches, transitions, timeline | Read-only list; **`useUpdateRxOrder` never called** | `rx_orders`: 27, `optical_labs`: **0** |
| Unified lab tracking | Labs, routing rules, batches, lead times ✅; no Essilor/Zeiss EDI | None | — |
| Remote optician approval | `remote-approval` ✅ queue, claim, heartbeat, sign-off, anomaly (PD, Rx jumps, measurements) | Queue screen ✅; **stylist "Submit for review" (`useSubmitApproval`) never called**; detail and checklist hooks unused | `rx_approval_requests`: **0**, `optician_credentials`: **0** |
| Tiered loyalty | `loyalty` ✅ tiers, referrals, trials, credits | Credit balance + issue only | `loyalty_tiers`: empty |
| Turnover analytics | `inventory/velocity` ✅, `financial-analytics/sales/velocity` ✅ | None | — |
| OD referrals | ❌ **No module.** Only `RxCaptureSource = 'optometrist_direct'` | None | — |
| Deposits / payments | `payments` ✅ (deposit/balance schedules, keyed on Shopify draft orders) | None | Store still on Square: 7,283 Square orders |
| Bilingual FR/EN | Location labels localized | **No i18n at all** | — |
| Law 25 / AI disclosure | `consent` module ✅ | Consent modal for photos only | `consent_log`: 38k (web) |

**Diagnosis:** V1 was built screen by screen against the Foundry API. Each feature got a screen, but nothing joins the screens into the one workflow the deck describes: walk-in to pickup. The engines that make the deck's numbers (hot leads, multi-pair, approvals, receipts) depend on the floor feeding them try-ons, outcomes, Rx and submissions. Right now it doesn't, so in production every one of those tables is empty.

### 2.2 Critical regression

Commit `594aaf6` ("client profile, appointments, multi-pair, and UI updates") removed `useCreateSession().mutate(...)` from `app/(app)/clients/[id]/session.tsx`. Sessions now only get a local placeholder id (`useSessionStore.ts:105`), and end-session is guarded against local ids (`731f976`). **No try-on session from the iPad reaches Foundry.** Fitting photos and verdicts live only in Zustand (`useFittingStore`) and never upload. Product interactions are logged only from the product detail screen, not from fittings. The whole Smart Discounts module, the deck's headline feature, has no input.

### 2.3 Orphaned capability

33 API hooks are built and never consumed by any screen, including `useCreateSession`, `useSubmitApproval`, `useRxApproval`, `useApprovalChecklist`, `useReadinessCheck`, `useUpdateRxOrder`, `useRxPipelineOrder`, `useAcceptRecommendation`, `usePrescription`, `useUpdatePrescription`, `useResolveBarcode`, `useReleaseProtection`, `useExtendProtection`, `useDuplicateCheck`, `useClientSuggestions` and `useRegenerateReceipt`. V2 is mostly **wiring and composition**, not new backend.

### 2.4 Other V1 debt that V2 must clear

- Portrait by default (`app.config.js` `orientation: 'default'`). The charter says landscape first.
- Brand: the charter listed navy `#0A153D`, green `#005D23` and off-white `#F5F2EC`, but the live Lunettiq brand (Foundry tokens, storefront) is white / warm grey / near-black with blue `#023891`. **Decision (2026-10-16): keep the live storefront brand**; the charter has been corrected. The real gap was a plain "L" sign-in screen and a placeholder navy splash.
- 30 `Alert.alert` calls and ~20 "coming soon" TODOs in demo paths.
- The More tab is hidden from the tab bar (`href: null`), so Rx, Second Sight and Custom Design are hard to reach.
- Offline writes are not wired (`useOfflineWrite` has 0 consumers; only Appointments reads offline).
- The `lunettiq-demo` tenant has 0 appointments today or later and empty hot leads, receipts, approvals and multi-pair data.

---

## 3. V2 product principles

On top of the 7 charter principles:

1. **One visit, one spine.** Every floor interaction is a step in a *Visit* that starts at welcome and ends in one of three closes. No orphan screens.
2. **The floor feeds the engines.** Every tap that matters (try-on, verdict, outcome, Rx, quote, deposit) becomes server data within seconds, or is queued offline. A feature isn't done until it writes.
3. **Role is a fact, not a setting.** Stylist and optician see different actions. Reserved acts (lab dispatch, dispense) are hard-gated by credential, not hidden in a menu.
4. **Every queue has a "Do next" button.** The call queue, Awaiting Rx, review inbox and pickups all open on the next item with full context and a script.
5. **Bilingual and compliant by construction.** FR/EN on every string, an "AI was used here" label on OCR, measurements, stylist and multi-pair, and consent captured at the point of collection.
6. **The client is the audience.** Anything in handed or client-visible mode is set in large type, with photos first and no internal numbers.

---

## 4. V2 information architecture

Five tabs, landscape, with the floating tab bar kept and re-skinned:

| Tab | Who | Replaces | Purpose |
|---|---|---|---|
| **Floor** | All | Home | Today: appointments, walk-in button, pickups due, Awaiting Rx due, calls due, holds expiring. Every card is an action. |
| **Clients** | All | Clients | Search + profile. The profile becomes a single-scroll *client story*: Rx history, pairs owned, try-ons, open orders, insurance left, loyalty tier. |
| **Orders** | All (actions role-gated) | More → Rx Pipeline | Kanban by stage: *Awaiting Rx · In review · Ready for lab · At lab · Ready for pickup*, with aging badges and a "Run today's reminders" button. |
| **Follow-ups** | All | — (new) | The Smart Discounts call queue: day 7 calls, last chances, OD-cooling alerts (later), each with a script and the authorized discount. |
| **Review** | Opticians only (`org:rx:verify` / `org:rx:sign_off`) | More → Rx Approvals | The cross-store review inbox. "Open next →". |

Second Sight and Custom Design leave V2 navigation entirely and return as visit side paths in V3/V4 (decision 6). Their code stays in the repo. Configurator, Multi-pair, Loyalty and Receipts stop being destinations. They become **steps inside the Visit** or **sections of the client story**. Manager insights (turnover, OD referrals, KPIs) live behind the Floor header's store menu for `admin`/`owner`.

### The Visit spine (the core of V2)

```
 Welcome ─► Quick-build file ─► Lifestyle (handed) ─► Frames & try-on ─► Quote ─► Multi-pair ─► Close
   │            │ Rx photo → OCR       │ questionnaire        │ AI stylist (in-stock)   │ lens+add-ons    │ bundle      │
   │            │ duplicate check      │ → upsell signals     │ photo + verdict = try-on│ insurance-aware │ accept      ├─ Bought → deposit → Submit for review → Receipt (now / schedule / print)
   │            │ consent (Law 25)     │                      │ hold on shortlist       │ TPS/TVQ total   │             ├─ Bought, no Rx → Awaiting Rx (lab blocked) → OD upload link + D3/7/14
   └ appointment or walk-in                                                                                            └─ No sale → hot lead → D3 email / D7 call / D14 SMS
```

The step rail sits at the top of the session screen (`SessionTopBar`). Steps can be skipped, and every step writes to the server as it completes.

---

## 5. Workstreams

Each item names the code to touch, the Foundry dependency, and the acceptance test. "FE" = this repo, "BE" = Foundry.

### WS0 · Foundations (unblocks everything) — Sprint 0

| # | Task | Where | Acceptance |
|---|---|---|---|
| 0.1 | **Restore server session creation.** Start a Visit → `useCreateSession` → replace the local id; end → `useEndSession` with outcome; queue offline when the network is down | `app/(app)/clients/[id]/session.tsx`, `useSessionStore.ts`, `useSessions.ts`, `SyncQueue.createSessionWrite` | `crm_try_on_sessions` gains a row per visit in `lunettiq-demo` |
| 0.2 | **Persist try-ons.** Each fitting photo upload + verdict → `useCreateProductInteraction` (`tried_on`, verdict) linked to the session | `fitting.tsx`, `useFittingStore.ts`, `PhotoUploadWorker.ts` | A no-sale visit creates a `hot_lead_opportunities` row via the existing event |
| 0.3 | **Landscape first** + live storefront brand (Foundry tokens), wordmark splash, sign-in and lock screens | `app.config.js` (`orientation: 'landscape'`, `requireFullScreen`), `assets/splash.png`, `(auth)/login.tsx`, `PinLockScreen.tsx`, `src/ui/Wordmark.tsx` | `pnpm audit:design` passes; app launches landscape; primary CTAs use `accent` |
| 0.4 | **i18n FR/EN** with `i18next` + `expo-localization`; extract strings screen by screen; language switch in Profile; client language on the profile drives client-facing screens | new `src/i18n/`, all screens | 100% of the Visit spine in FR and EN |
| 0.5 | **Replace `Alert.alert`** with `Sheet`/`Toast`; remove or hide every "coming soon" | 30 call sites | `grep -r "Alert.alert\|coming soon"` = 0 in `app/` |
| 0.6 | **Offline writes** through `useOfflineWrite` for: session start/end, interactions, verdicts, notes, holds, questionnaire | `src/sync/*`, the mutations above | Airplane-mode visit syncs on reconnect, with the pending count shown in `SyncIndicator` |
| 0.7 | **Demo seed (BE)**: `scripts/seed-lunettiq-demo.ts`, idempotent and relative to *today*: 8 appointments, 5 showcase clients (Marie Dubois, Lucas Martin, Robert Chen, Emma Bouchard, Yuki Nakamura, the deck's own cast), Rx history, orders in every Rx stage incl. 4 *Awaiting Rx* with deposits, 4 hot leads at D3/D7/D14, 2 pending approvals (one with a PD anomaly), 1 scheduled receipt, optician credential for Karim, 1 lab (Essilor), loyalty tiers. Plus a `POST /api/admin/demo/reset` gated to `env=demo`, and a "Reset demo" row in Profile | Foundry `scripts/`, iPad `profile/index.tsx` | Every screen in the demo script shows real data on any day |
| 0.8 | **Fix the tab structure** to the 5-tab IA; retire the hidden More tab | `app/(app)/_layout.tsx`, `FloatingTabBar.tsx` | Every feature reachable in ≤ 2 taps |

### WS1 · The Visit spine — Sprint 1

| # | Task | Where | Acceptance |
|---|---|---|---|
| 1.1 | **Visit shell**: step rail (Welcome → File → Lifestyle → Frames → Quote → Close), resumable, one active visit per device, timer, privacy toggle always visible | new `src/features/visit/`, re-home `session.tsx`, `SessionTopBar.tsx`, `ModeStrip.tsx` | A visit survives app restart |
| 1.2 | **Quick-build file** (< 60 s): name, phone, email optional, language, and duplicate check while typing (`useDuplicateCheck`); consent toggles per purpose (Law 25) | `clients/new.tsx` → `visit/QuickBuild.tsx` | Timed walkthrough < 60 s |
| 1.3 | **Rx capture + OCR**: camera → `/api/rx/upload-url` → `/api/rx/scan` → editable OD/OS grid (SPH/CYL/AXIS/ADD/PD) with per-field confidence, the AI label, then `/api/rx/submit`. Source = `ocr`/`manual`/`existing` | new `useRxCapture.ts` (port `prescription/storefront/use-rx-capture.ts`), `PrescriptionSheet.tsx` | A paper Rx becomes a `prescriptions` row with source `ocr` |
| 1.4 | **Lifestyle in handed mode**: the existing `LifestyleQuestionnaireSheet` as full-screen tap cards in `HandedToClientView`, with a PIN to reclaim (finish the biometric TODO in `useHandedMode.ts:92`) | `features/fitting/HandedToClientView.tsx` | Questionnaire saved via `useSaveQuestionnaire` |
| 1.5 | **Frames**: AI stylist panel defaults to *in stock at this location* (`X-Found-Location`), barcode scan to add a frame (`useResolveBarcode`), "Add to fitting" from the product page (TODO `products/[id].tsx:198`) | `AiStylistPanel.tsx`, `products/scanner.tsx` | A scanned frame lands on the shelf |
| 1.6 | **Shortlist = hold**: the shortlist action creates a `try_on_hold` protection, with release/extend (`useReleaseProtection`, `useExtendProtection`); remove the shortlist TODOs in `fitting.tsx:141`, `HandedToClientView.tsx:39`, `FrameDetailPopover.tsx:39` | `useShortlistWithHold.ts` | A hold shows on Floor with its expiry |

### WS2 · Quote and close — Sprint 2

| # | Task | Where | Acceptance |
|---|---|---|---|
| 2.1 | **Quote builder**: frame + lens (configurator resolve) + add-on toggles, running total, TPS 5% / TVQ 9.975%, insurance allowance applied (`/api/admin/multi-pair/insurance`), loyalty credit applied; client-visible version hides margins | `features/configurator/` → `visit/Quote.tsx` | Totals match the deck's receipt example to the cent |
| 2.2 | **Multi-pair in the quote**: confidence rings, "lead with ≥ 80%", one-tap **Apply bundle** → `useAcceptRecommendation` | `MultiPairResultsSheet.tsx` → `visit/MultiPair.tsx` | `pair_recommendations` records the acceptance |
| 2.3 | **Close: Bought** → create the Rx order (`useCreateRxOrder`) with frame, lens, measurements, prescription and line items; the stylist charges on Square and then records deposit amount + Square receipt # (decision 1) | `OrderSummarySheet.tsx` → `visit/Close.tsx`; BE `PaymentProvider` (`square`) + nightly match against `square_orders_projection` | The order appears in Orders with the deposit recorded; the match job pairs it with the Square order |
| 2.4 | **Close: Bought, no Rx** → order in `awaiting_rx` with deposit; text the OD direct-upload link through the service SMS channel (decision 2); lab dispatch blocked | same + BE `communications/sms` (Twilio) | The order shows as *Awaiting Rx · Day 0*, and the SMS appears on its timeline |
| 2.5 | **Close: No sale** → end the session with outcome `left_empty_handed` + the frames tried; confirm "Added to follow-ups" | `EndSessionSheet.tsx` | A hot lead appears in Follow-ups |
| 2.6 | **Receipts at close**: *Send now / Schedule for… / Print*. Schedule uses `/api/admin/receipts/{id}/schedule` with a reason (benefits renewal, FSA, tax year, custom) | `visit/Receipt.tsx`, `useReceipts.ts` (+ `useScheduleReceipt`) | A scheduled receipt shows in the client story with a cancel option |

### WS3 · Orders: Rx pipeline, Awaiting Rx and labs — Sprint 2–3

| # | Task | Where | Acceptance |
|---|---|---|---|
| 3.1 | **Orders kanban** (landscape, horizontally scrolling columns) with aging chips (2D/5D/11D/23D) and held-deposit totals per column | `more/rx-pipeline.tsx` → `orders/index.tsx` | Matches deck p.12 |
| 3.2 | **Order detail**: timeline (`/orders/{id}/timeline`), notes, line items, PDF, lab and ETA; **role-gated transitions** via `/orders/{id}/transition` (`useUpdateRxOrder` + `useReadinessCheck`) | new `orders/[id].tsx` | A stylist can't push past `optician_review`; an optician can |
| 3.3 | **Rx arrives**: from an *Awaiting Rx* card → Rx capture/OCR (1.3) → status flips to `rx_submitted` → optician review | reuse 1.3 | End to end in < 2 min |
| 3.4 | **"Run today's reminders"**: one button that triggers D3/D7/D14 Awaiting-Rx nudges (the cadence is already defined in `rx-operations/jobs.ts`; texts go through the service SMS channel), with the *Stale · refund or push?* decision at day 21+ | Orders header | Reminder events land on the order timeline |
| 3.5 | **Pickup**: *Ready for pickup* shows balance owing → charge on Square → record via `/orders/{id}/collect-payment` with the Square receipt # → dispense (optician only); service SMS "ready for pickup" when the order reaches this stage | `orders/[id].tsx` | `dispense_events` row with the optician credential |
| 3.6 | **V2.1 · Email order to lab**: one tap sends the order PDF to the lab's email on `optical_labs` and moves the order to `at_lab` (decision 3) | BE: email the existing `/orders/{id}/pdf`; FE: button on `orders/[id].tsx` | The email is logged on the timeline; integrations come later |

### WS4 · Remote optician approval — Sprint 3

| # | Task | Where | Acceptance |
|---|---|---|---|
| 4.1 | **Stylist: Submit for review**: one tap from Close or Order detail, bundling Rx, measurements, frame, photos and notes (`useSubmitApproval`) | `visit/Close.tsx`, `orders/[id].tsx` | A request appears in Karim's inbox |
| 4.2 | **Review inbox** across stores (store chip, stylist, age, anomaly badge), "Open next →", today's tally *14 reviewed · 4 pending* | `more/rx-approvals.tsx` → `review/index.tsx` | Matches deck p.13 |
| 4.3 | **Review detail**: Rx snapshot vs. measurements vs. frame, photo strip, checklist (`useApprovalChecklist`), anomaly evidence (PD difference, Rx jump), correct-in-place (`useSubmitCorrections`), claim + heartbeat, then **Sign off with credential** (biometric + OOAQ #) | new `review/[id].tsx` | The sign-off records credential + timestamp; a < 30 s review shows a warning |
| 4.4 | **Push**: a new item notifies on-duty opticians; approval notifies the stylist (`usePushRegistration` is wired; add the handlers) | `features/push/` | Two-device demo works |
| 4.5 | **Optician credential onboarding** in Profile (OOAQ #, signature) | `profile/index.tsx` | `optician_credentials` populated |

### WS5 · Follow-ups (Smart Discounts) — Sprint 4

| # | Task | Where | Acceptance |
|---|---|---|---|
| 5.1 | **API hooks** for `/api/admin/hot-leads/queue`, `/stats`, `/[id]`, `/contacts` | new `src/api/useHotLeads.ts` | Typed |
| 5.2 | **Call queue**: the deck p.7 layout, with intent signals (email opens, return visits, quote views), authorized discount tier, due badge (CALL NOW / DUE 2H / LAST CHANCE) | `follow-ups/index.tsx` | Renders seeded leads |
| 5.3 | **Call card**: frames tried with photos, last visit notes, generated script (FR/EN), the authorized code, then log outcome (reached / voicemail / booked / declined) → `/contacts` | `follow-ups/[id].tsx` | The outcome moves the lead's status |
| 5.4 | **Recovered revenue**: MTD recovered and recovery rate, from `/stats`, on Floor and in Follow-ups | Floor header | Shows the deck's KPI |

### WS6 · Manager insights — Sprint 5

| # | Task | Where | Acceptance |
|---|---|---|---|
| 6.1 | **Turnover**: top movers, dead stock (90+ days, $ tied up), velocity buckets, reorder triggers from `/api/inventory/velocity` | `insights/turnover.tsx` | Matches deck p.11 |
| 6.2 | **KPIs**: pairs per visit, try-on conversion, average ticket, recovery rate. These need the WS0–2 data to exist | `insights/index.tsx` + BE aggregate endpoint | Numbers reconcile with Foundry admin |
| 6.3 | **OD referrals (BE, new module)**: `referring_optometrists` + referral attribution on client/Rx (source `optometrist_direct` already exists), conversion, revenue, cooling detection (> 30 days), nurture tasks | Foundry `src/lib/modules/od-referrals/` | Deck p.10 data available |
| 6.4 | **OD referrals (FE)**: "Referred by" picker in Quick-build; the referrers list with cooling alerts, which also feed Follow-ups | `insights/referrals.tsx` | Captured on new clients |

### WS7 · Compliance by construction — runs through every sprint

- **Law 25:** consent per purpose at collection (photos, marketing, AI processing), recorded via the `consent` module; "Delete / export my data" request from the client story.
- **AI disclosure (§12.1):** a shared `<AiUsedBadge reason=…>` on OCR fields, AI-stylist ranks, multi-pair confidence and anomaly flags, each with a short "why".
- **OOAQ:** dispense and lab dispatch actions render only for credentialed opticians, and the server enforces them too. The audit trail is visible on every order.
- **CASL:** marketing consent checked before any follow-up message is queued; the call script mentions unsubscribe on SMS.
- **PCI:** no card data on the device. Cards are charged on the Square terminal, and the iPad stores only the amount and the Square receipt reference.

---

## 6. Sequencing

The deck's own roadmap puts Quebec pilots in Q4 2026–Q1 2027. Today is Oct 15, 2026. Six two-week sprints get V2 into the own store before the holidays and ready for partner pilots in late January.

| Sprint | Dates | Theme | Demo at end |
|---|---|---|---|
| **S0** | Oct 19 – Oct 30 | Foundations: session fix, try-on persistence, landscape + brand, i18n scaffold, demo seed, 5-tab IA | Walk-in → fitting → no sale → lead exists on the server |
| **S1** | Nov 2 – Nov 13 | Visit spine: quick-build, Rx OCR, handed lifestyle, in-stock stylist, shortlist holds | Full front half of a visit in FR |
| **S2** | Nov 16 – Nov 27 | Quote + three closes + receipts; Orders kanban | **Own-store pilot starts** (parallel to Square) |
| **S3** | Nov 30 – Dec 11 | Order detail + transitions; remote approval end to end | Two-iPad demo: Léa submits, Karim signs off |
| **S4** | Dec 14 – Jan 8 | Follow-ups call queue; multi-pair bundle; offline hardening (holiday season = real traffic) | Day-7 call with script and code |
| **S5** | Jan 11 – Jan 22 | Insights (turnover, KPIs), OD referrals v1, pilot packaging (TestFlight, onboarding < 2 days) | Partner-store pilot readiness review |

Critical path: **0.1 → 0.2 → 2.5 → 5.x**. Smart Discounts can't show real numbers until visits have been writing try-ons for a few weeks, so 0.1/0.2 ship in week 1.

---

## 7. The V2 demo script (10 minutes)

Run on `lunettiq-demo` after "Reset demo", landscape, two iPads (stylist, optician).

1. **Floor** (30 s): today's 8 appointments, 2 pickups, 4 *Awaiting Rx*, 4 calls, *$3.2k recovered MTD*.
2. **Walk-in** (90 s): quick-build in under 60 s, photograph a paper Rx, OCR fills it with the AI label, confirm.
3. **Handed** (60 s): the client taps the lifestyle cards herself.
4. **Frames** (2 min): in-stock AI matches, try on 3, photos, verdicts, shortlist = hold.
5. **Quote** (90 s): lens + AR, insurance *$200 left, expires Dec 31*, multi-pair *Polarized sun 92%*, apply bundle (+$505).
6. **Close** (60 s): deposit, Submit for review, schedule receipt for Jan 2.
7. **Optician iPad** (60 s): inbox ping, review with a PD anomaly flag, sign off. The stylist iPad gets "Approved".
8. **Follow-ups** (60 s): Lucas Martin's day-7 call card with script and 10% code.
9. **Orders** (30 s): Robert Chen *Day 23 · Stale · refund or push?*

---

## 8. How we'll know it works

Instrument from S0 so the deck's targets can be measured, not just claimed:

| Metric | Deck baseline → target | Source |
|---|---|---|
| Pairs per visit | 1.4 → 2.1 | Rx order line items per session |
| Try-on conversion | 72% → 88% | Sessions with outcome `purchased` ÷ all |
| Discount recovery rate | 0% → 31% | `hot-leads/stats` converted ÷ created |
| Average ticket | $480 → $640 | Order totals per visit |
| File build time | — → < 60 s | Client-side timer, Quick-build open → save |
| Optician review time | — → ~3 min | `remote-approval` claim → sign-off |
| Inventory turnover | 4.2× → 8.7× | `inventory/velocity` |

---

## 9. Decisions (Oct 15, 2026)

1. **Payment: Square now, Shopify POS later.** Money moves on the Square terminal. The iPad never takes card data; it records what was paid. At close, the stylist enters the deposit amount and the Square receipt number on the order (`payment_records`, method `square`). Foundry already syncs Square orders (`square_orders_projection`), so a nightly job matches each recorded deposit to its Square order by receipt number and flags mismatches. Pickup works the same way: balance owing is shown, collected on Square, then recorded. Keep it behind a `PaymentProvider` interface (`square` | `shopify_pos`) so the Shopify POS move is an adapter swap, not a rewrite.
2. **SMS: two channels, chosen to stay cheap.**
   - **Marketing texts** (day-14 win-back offer) stay on **Klaviyo SMS**. Foundry's hot-leads module already dispatches the day-14 SMS through Klaviyo via `email-flows`, and Klaviyo already holds the store's marketing consent and unsubscribe handling (CASL). No new vendor. Check that SMS is enabled on the Lunettiq Klaviyo account and that the plan includes enough SMS credits.
   - **Service texts** (Awaiting-Rx reminders, OD direct-upload link, ready for pickup, approval notices) go through a raw SMS API on one Canadian long code. Those messages are transactional, so they don't need marketing consent. List prices are close: Plivo about $0.0077 and Twilio about $0.0083 per Canadian segment, plus carrier fees. Telnyx advertises about $0.004 elsewhere, but I couldn't confirm its Canada rate. At one store's volume (est. 500–1,500 texts a month) every option costs roughly $5–15 a month plus about $1–2 for the number.
   - **Recommendation: Twilio.** The price difference is a few dollars a month. Twilio has the best docs and SDK, and the most reliable delivery reporting. Build it as a `communications/sms` adapter in Foundry so it can switch to Telnyx or Plivo if volume grows across pilot stores. Confirm current Canada rates on the providers' live pricing pages before signing up.
3. **Labs: manual now, then email, then integration.** V2 ships manual tracking: stage changes, ETAs, and auto-chase tasks. Next step (V2.1): one-tap **Email order to lab**, using the existing order PDF endpoint (`/orders/{id}/pdf`) and the lab's address on `optical_labs`, logged on the order timeline. Lab integrations (Essilor/Zeiss portals or EDI) come in a later phase.
4. **Optician sign-off: in store or remote.** The Review inbox works for both. It shows the store chip on every item, and an optician sees their own store first plus any store they cover. Shift-based routing (`optician_coverage_shifts`) is deferred until there's more than one optician.
5. **AI selfie measurements: Phase 3.** V2 keeps manual PD and seg-height entry, and the LiDAR button stays hidden.
6. **Second Sight and Custom Design: V3/V4.** They come out of V2 navigation and the demo script. The code stays in the repo untouched and comes back as visit side paths in V3/V4.

---

## 10. What this plan deliberately doesn't do

- No new backend except OD referrals (6.3), the demo seed/reset (0.7), a KPI aggregate (6.2), and whatever Q1/Q2 decide.
- No Android. The iPad Pro 13 is the target device.
- No marketplace, financing or US insurers (deck Phase 4).

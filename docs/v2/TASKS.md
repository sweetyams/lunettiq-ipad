# V2 task tracker

Live status of the V2 plan. Task numbers and details are in [V2-PLAN.md](V2-PLAN.md) §5.
Updated with every commit. Branch: `feat/v2-s0-visit-persistence` (iPad), `feat/lunettiq-demo-today-seed` (Foundry).

**Legend:** ✅ done · 🔄 in progress · ⬜ not started · ⏸ blocked

## Sprint 0 · Foundations (Oct 19 – Oct 30)

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Restore server session creation | ✅ | `3aa7fe9`. Verified live: visit created on Foundry, ended with outcome |
| 0.2 | Persist try-ons (frames + verdicts) | ✅ | `3aa7fe9`, `38ca5f7`. Verified live: try-ons → hot lead created |
| 0.3 | Landscape first + brand + sign-in/lock | ✅ | `4370815`, `450a407`. Brand decision: keep live storefront tokens |
| 0.4 | i18n FR/EN | ⬜ | |
| 0.5 | Replace `Alert.alert`, remove "coming soon" | ⬜ | 30 alerts, ~20 stubs |
| 0.6 | Offline writes (session, try-ons, notes, holds) | ⬜ | Connectivity check fixed (`b502d2f`) |
| 0.7 | Demo seed relative to today | ✅ | Foundry `dbc614302`, `5de9458c7` (not merged). Re-run before each demo |
| 0.8 | Five-tab structure (Floor, Clients, Orders, Follow-ups, Review) | ✅ | Pending commit hash below. Orders = stage list (kanban is 3.1); Follow-ups = call queue (call card is 5.3); Review = inbox with claim/release (sign-off is 4.3) |

### Unplanned fixes found along the way (Sprint 0)

| Fix | Commit |
|---|---|
| App always thought it was offline (dead `httpstat.us` probe) | `b502d2f` |
| Visit screen froze the app; frames saved without a product id | `e0914fa` |
| Auto-lock setting had no screen (Profile → Store → Auto-lock) | `e0914fa` |
| Appointments without names/types/durations; week filter ignored | `ea6bef5` |
| Rx counts card empty, Rx Pipeline screen crashed on real data | `ea6bef5` |
| Unreadable status badges; Home not refreshing on return | `450a407` |

## Waiting on Foundry

See [01-foundry-handoff-hot-leads.md](01-foundry-handoff-hot-leads.md).

| Item | Status |
|---|---|
| Hot leads skip non-canonical client ids (most production clients) | ⏸ Foundry fix needed |
| Tablet sessions have no `staff_id` | ⏸ Foundry fix needed |
| `/api/scheduling` should include client name | ⏸ Nice to have (iPad works around it) |
| Merge `feat/lunettiq-demo-today-seed` | ⏸ Your review |

## Sprint 1 · Visit spine (Nov 2 – Nov 13)

| # | Task | Status |
|---|---|---|
| 1.1 | Visit shell (step rail, resumable) | ⬜ |
| 1.2 | Quick-build file < 60 s | ⬜ |
| 1.3 | Rx capture + OCR | ⬜ |
| 1.4 | Lifestyle in handed mode | ⬜ |
| 1.5 | Frames: in-stock stylist, barcode, add to fitting | ⬜ |
| 1.6 | Shortlist = hold | ⬜ |

## Sprint 2 · Quote and close (Nov 16 – Nov 27)

| # | Task | Status |
|---|---|---|
| 2.1 | Quote builder (TPS/TVQ, insurance, loyalty) | ⬜ |
| 2.2 | Multi-pair bundle in the quote | ⬜ |
| 2.3 | Close: Bought (Square deposit recorded) | ⬜ |
| 2.4 | Close: Bought, no Rx (Awaiting Rx + OD link SMS) | ⬜ |
| 2.5 | Close: No sale → hot lead | ✅ (via 0.1/0.2) |
| 2.6 | Receipts at close (send / schedule / print) | ⬜ |
| 3.1 | Orders kanban | ⬜ |

## Later sprints

S3 orders detail + remote approval (3.2–3.6, 4.1–4.5) · S4 Follow-ups (5.1–5.4) · S5 insights + OD referrals (6.1–6.4) · WS7 compliance runs throughout. Details in [V2-PLAN.md](V2-PLAN.md).

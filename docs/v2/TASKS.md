# V2 task tracker

Live status of the V2 plan. Task numbers and details are in [V2-PLAN.md](V2-PLAN.md) §5.
Updated with every commit. Branch: `feat/v2-s0-visit-persistence` (iPad), `feat/lunettiq-demo-today-seed` (Foundry).

**Legend:** ✅ done · 🔄 in progress · ⬜ not started · ⏸ blocked · ➡️ moved

## Sprint 0 · Foundations (Oct 19 – Oct 30)

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | Restore server session creation | ✅ | `3aa7fe9`. Verified live: visit created on Foundry, ended with outcome |
| 0.2 | Persist try-ons (frames + verdicts) | ✅ | `3aa7fe9`, `38ca5f7`. Verified live: try-ons → hot lead created |
| 0.3 | Landscape first + brand + sign-in/lock | ✅ | `4370815`, `450a407`. Brand decision: keep live storefront tokens |
| 0.4 | i18n FR/EN | 🔄 | Scaffold (`src/i18n`, no new deps) + client-facing screens in FR/EN (handed mode, timeout, consent script); App language in Profile. Next: extract staff screens (Floor → Visit spine first) |
| 0.5 | Replace `Alert.alert`, remove "coming soon" | ➡️ | Moved into Phase D (D10) |
| 0.6 | Offline writes (session, try-ons, notes, holds) | ⬜ | Connectivity check fixed (`b502d2f`) |
| 0.7 | Demo seed relative to today | ✅ | Foundry `dbc614302`, `5de9458c7` (not merged). Re-run before each demo |
| 0.8 | Five-tab structure (Floor, Clients, Orders, Follow-ups, Review) | ✅ | `35dc5df`. Orders = stage list (kanban is 3.1); Follow-ups = call queue (call card is 5.3); Review = inbox with claim/release (sign-off is 4.3) |

### Unplanned fixes found along the way (Sprint 0)

| Fix | Commit |
|---|---|
| App always thought it was offline (dead `httpstat.us` probe) | `b502d2f` |
| Visit screen froze the app; frames saved without a product id | `e0914fa` |
| Auto-lock setting had no screen (Profile → Store → Auto-lock) | `e0914fa` |
| Appointments without names/types/durations; week filter ignored | `ea6bef5` |
| Rx counts card empty, Rx Pipeline screen crashed on real data | `ea6bef5` |
| Unreadable status badges; Home not refreshing on return | `450a407` |
| iPad locked with Auto-lock = Never (relaunch lock; edge lock tab over content) | `5781ea0`, see CHANGELOG |

## Phase D · Design parity with the Builder (added Oct 16)

Spec and full screen audit: [02-design-parity.md](02-design-parity.md). *Builder chrome, Lunettiq content.* Runs before Sprint 1 so new screens are built on the kit.

| # | Task | Status | Notes |
|---|---|---|---|
| D0 | Found UI tokens, system font, touch type scale | ✅ | White surfaces, zinc hairlines, Found UI status colours, 14px floor, legacy class aliases. Elevation presets move to D1 (kit components) |
| D1 | Kit components + preview screen | ✅ | `src/ui/kit` (Badge, StatusDot, Button, Section, PageHeader, ListRow, StatRow, FilterChips, KeyValue, Tabs, Sheet, Field, ChoiceChips, VerdictPicker). Built during D4–D10; no separate preview screen |
| D2 | App shell (status pill, tab badges, session bar, lock) | ✅ | Done during D5/D9 (SessionBar, FloatingTabBar, PIN lock) |
| D3 | Floor (reference screen, review before going wide) | ✅ | Walk-in primary (D11) |
| D4 | Clients: list, profile + tabs, new client, profile sheets | ✅ | `D4.1`–`D4.4` done. New client is blocked on Foundry (no create endpoint; see handoff §"Missing / mismatched client endpoints") |
| D5 | Visit: workspace, fitting, handed mode, end visit | ✅ | Rebuilt on the kit; handed-mode exit now PIN-gated. To verify on device: double-tap exit → PIN, End visit sheet |
| D6 | Schedule + appointment sheets | ✅ | Today / Week / Staff + detail inspector, one-page booking, reschedule, real walk-in. Foundry: roster + holds filters (handoff) |
| D7 | Products + configurator | ✅ | Frames tab restored; catalogue, detail, scanner, configurator, order summary on the kit. Orders now reach Foundry (customerId + configuration) |
| D8 | Orders, Follow-ups, Review | ✅ | Kit: PageHeader, FilterChips, Section, ListRow, Badge. Follow-ups grouped Call today / In the sequence; Review anomalies as danger badges, Claim next as the primary |
| D9 | Profile, settings, auth, store picker, side paths | ✅ | Profile + Settings merged; sign-in email-code flow real; store picker errors shown; tab avatar fixed. Side paths (Second Sight, Custom Design) left unlinked for V3/V4 |
| D10 | States, toasts, confirmations; remove all `Alert.alert` | ✅ | Kit Loading / Empty / Error (plain-language errors by status), Builder toasts; no native Alerts outside parked side paths (audit-enforced) |
| D11 | Enforcement + visual QA | ✅ | `docs/v2/qa/` (16 screens + findings). Audit fails on native Alert and `color-*` classes. Device checks left: handed exit → PIN, End visit, one real order |

Baseline (Oct 16): 288 grey fills · 305 hex colours · 266 sub-14px text · 85 brand-blue buttons · 79 non-existent classes · 30 `Alert.alert` · 10 left-edge status bars · no custom font loaded.

## Phase O · Orientation, screen sizes and keyboard (added Oct 20)

0.3 locked the app to landscape and every layout assumes a 13" iPad (fixed 640/880 pt sheets, 784 pt sheet height, 440 pt list column). On an 11" iPad the keyboard leaves room for one search result; portrait isn't possible. Goal: usable in both orientations on 11" and 13", and search that stays readable with the keyboard up.

| # | Task | Status | Notes |
|---|---|---|---|
| O1 | Unlock orientation; `useLayout` (portrait/landscape, compact/regular/wide) + `useKeyboard` hooks | 🔄 | Native change: needs a dev-client rebuild and TestFlight build 4 |
| O2 | Sheets fit the screen and the keyboard | ⬜ | Width = min(640/880, screen − 32); height = space above the keyboard; compact header while typing |
| O3 | One client search pattern | ⬜ | Field pinned top, results fill to the keyboard, Return picks the top result, drag dismisses. Clients, Walk-in, Link client, Book appointment, Frames |
| O4 | Screens reflow in portrait / 11" | ⬜ | Two-pane screens (Clients, Schedule, profile, visit, Frames detail) stack or narrow; Floor columns; tab bar |
| O5 | QA in 4 setups + TestFlight build 4 | ⬜ | 11"/13" × portrait/landscape screenshots in `docs/v2/qa/orientation/` |

## Waiting on Foundry

See [01-foundry-handoff-hot-leads.md](01-foundry-handoff-hot-leads.md).

| Item | Status |
|---|---|
| Hot leads, shell customers, Rx/holds filters, create client, duplicates, roster, Rx validation, client links, staff attribution, end-visit fields, appointment names, Rx paging, scan ids | 🔄 Built on Foundry branch `fix/ipad-v2-api-gaps` (15 commits, not merged). Review prompt: [04-foundry-review-prompt.md](04-foundry-review-prompt.md) |
| Demo lens configurator flow | ⏸ Your call: copy from production or hand-build |
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

# Gap checklist review and phased plan

**Date:** 2026-11-24
**Input:** *Lunettiq CRM & Clienteling App — Gap Checklist* (notes from the review with Ben). Items tagged **(D)** come from Seren's session, **(R)** from the optician's session.
**Checked against:** this repo at `9ede4da` + this change, and Foundry `main` at `f4b22a2b9` (the iPad API gaps branch is merged).
**Rule for this plan:** build on V2, don't restart it. Every item maps onto the existing visit spine, five tabs and Found UI kit ([V2-PLAN.md](V2-PLAN.md)).

Status legend: ✅ built in this change · 🟡 partly built / needs a Foundry change to finish · ⏳ planned (later phase) · ❓ open decision · ✔︎ already existed.

---

## 1. Is the checklist valid?

Mostly yes. It is accurate about the app as Seren and the optician saw it, and it lines up with the V2 plan. Five corrections:

| Checklist says | What's actually true |
|---|---|
| "Populate the follow-ups section with real data" (D) | The screen already reads Foundry's hot-leads queue. It looked empty because **no in-store try-on ever became a lead** (Foundry customer-id bug, fixed on `main`) and production has 0 leads. Real data arrives as visits are recorded; nothing to build on the iPad. |
| "Visit timer" (R) | Already there (visit header, `Visit · 12:04`). Kept. |
| "Insurance details", "Internal notes", "Linked clients" (D) | Already on the profile (Insurance section, Internal notes, Relationships tab with couple/parent/child links). ✔︎ |
| "Decide what the Reviews section is for" (D, R) | It's the **optician's approval inbox** (OOAQ sign-off), named "Review". Neither session recognised it because of the name. Renamed **Approvals**; its first tab is "Pending". This also settles the stage naming (see §3). |
| "Remove the discounts feature" (D, R) | The only discount surface was the follow-ups row ("10% authorized") and the Foundry hot-leads codes. Removed from the iPad. Foundry still generates a Shopify code on day 3/14 and has no "off" switch: **Foundry change needed** ([05-foundry-api-requests.md](05-foundry-api-requests.md) §1). |

Two items are gated on decisions, not work: walk-in counter definition, and scheduled invoices (§5).

---

## 2. Phases

Each phase ends in something Seren can click through on her iPad. Phases 1–2 are built in this change; 3–5 are the remaining work.

### Phase 1 · The floor makes sense (built)

| Item | Status | What was built |
|---|---|---|
| Home as a funnel: start a visit, find a customer, open a profile, create a customer (R) | ✅ | Floor opens on four large tiles. *Start a visit* opens Walk-in, *Open a profile* lists today's and recent clients. `src/features/floor/FloorFunnel.tsx` |
| Create customer from any page (R) | ✅ | New-client button in the tab bar (next to Lock) opens one app-wide sheet. `QuickClientSheet`, `useQuickClient` |
| Late orders on home as a daily status (D) | ✅ | *Today's status*: late orders (named), ready for pickup, paid without Rx (with "to remind" at 14+ days), follow-ups, pending approvals. |
| Client details surfaced and clickable (R) | ✅ | Client names on Floor appointments open the profile; "Coming back for…" shows in the profile header, follow-ups and visit close. |
| Polished visual direction, store colours and fonts (R) | ✔︎ / ⏳ | Found UI kit + Lunettiq tokens shipped in Phase D. Final visual pass with Ben/Seren is a review session, not a build (open: font licence for the storefront typeface on iOS). |
| Final arrangement of sections (D) | ⏳ | The funnel layout is a first pass; rearrange after Seren's click-through. |
| Remove discounts (D, R) | 🟡 | Gone from the iPad. Foundry switch needed. |
| Reviews section (D, R) | ✅ | Renamed **Approvals**; labels say "pending approval", "being checked", "approved today". |

### Phase 2 · Intake, visit and orders that match the store (built)

**Walk-in and intake**

| Item | Status | Notes |
|---|---|---|
| Register a walk-in without a full profile (D) / intake with no name (D) | 🟡 | *Start without details* creates a guest profile tagged `draft-profile` ("Guest · Nov 24 14:05"). Foundry can't create a nameless customer yet, so this is the workaround (§2 of the Foundry doc). |
| Register a customer from inside a walk-in (R) | ✅ | Walk-in sheet: *New client* and *Start without details* next to the search. |
| Walk-in counter, separate from customers helped (D) | ✅ / ❓ | *Store traffic*: one tap per person in; *Helped* counts visits started. Both are kept so the open decision can go either way. Stored on the iPad per store/day until Foundry has an endpoint. |
| Sunglass and optical paths (D) | ✅ | A sunglasses-only visit makes the prescription optional (File step says so; the step counts as done without Rx). |
| Guided questions → frame suggestions, e.g. funky + oversized → June (D) | ✅ | *Find their style* on the Frames step: five questions, store rules first ("funky + oversized → June"), then catalogue keywords. **Seren to supply the real rule list.** `styleFinder.ts` |
| Photograph a prescription and start a profile from it (D) | 🟡 | Photo → Foundry OCR → editable OD/OS grid → saved and attached to waiting orders. Foundry's scan doesn't return the **patient name** yet, so the profile isn't pre-filled from it. |
| No-prescription path: start a frame selection to pull (D) | ✅ | File step points to the lensometer reading and the tray; the tray is the pull list. |
| Draft profile from viewed/selected frames before contact (D) | ✅ | Guest profile records every frame tried and every reaction from the first tap. |
| Contact step as "send you your choices", no-marketing promise (D, R) | ✅ | *Send them their choices* (guest banner, visit header, Close step): name + mobile or email, "Just your choices. No newsletters, no marketing." Turns the guest into a real profile. |
| Save in-store measurement when no Rx (D) | ✅ | Measurements include a lensometer reading of their current pair. |

**Visit, tray and products**

| Item | Status | Notes |
|---|---|---|
| Tray easier to open and review (R) | ✅ | *Tray · n* button on every step + *Review* in the rail open a full tray sheet. |
| Tray view with variants and features (R) | ✅ | Large image, colourways from the product family, features, price, reaction, Order. |
| Add-ons easy to find; fix greyed-out options (R) | ✅ | The configurator's step chips were disabled until earlier steps were done, which greyed out add-ons. Every step is now reachable; ordering still needs the required steps. |
| Refine the product flow (R) | 🟡 | Tray + configurator fixes. Product detail itself unchanged (data judged adequate). |
| Visit timer (R) | ✔︎ | Already there. |
| Quick email and text during the conversation (R) | ✅ | *Message* in the visit header: preloaded templates, edit, opens Messages/Mail. |
| Outcomes linked to preloaded follow-up templates (R) | ✅ | End visit: each outcome preloads its message (left empty-handed → "Thanks for coming in", shortlist → "Your shortlist", …). Replaces the "Send a summary" switch, which Foundry never acted on. |
| Photos/video of frames to send afterwards (R) | 🟡 | Fitting photos exist; sending them needs Foundry media links in messages (Foundry doc §5). Share sheet sends frame names today. |
| Polished customer-facing presentation (R) | ✅ | *Show client*: full-screen "Marie's selection", large frame images, client's language, no prices or internal data, Share. |
| Receipt timing: send now or later (R) | ⏳ Phase 3 | Foundry has receipt schedule/cancel; receipts are keyed on `orders`, not Rx orders (Foundry doc §8). |

**Customer profile**

| Item | Status | Notes |
|---|---|---|
| PD, height/OC, optician, notes, simple entry (D) | ✅ | *Measurements* (Clinical tab + visit File step): OD/OS side by side, all optional, dated history. |
| Fields as a template other stores can reuse (D) | ✅ / 🟡 | The form renders from a template (`LUNETTIQ_MEASUREMENTS`). Stored on `customFields` until Foundry has a table + per-tenant template (Foundry doc §4). **Seren to confirm the field list.** |
| Insurance, internal notes, linked clients (D) | ✔︎ | Already there. |
| Wishlist tags (D) | ⏳ | Wishlist and tags exist separately; tagging wishlist items needs a Foundry field. Phase 4. |
| Handoff context: sun, 2nd/3rd pair, event, travel (D) | ✅ | *Coming back for* on the profile (top of Overview), header line, visit Close step, follow-up card. |
| Frame collection with categories, gaps visible (R) | ✅ | *Frame collection*: pairs by role (everyday, going out, sun, computer, reading, sport) with "Missing: Sun". |
| Prescription fit flag, warns never blocks (D) | ✅ | Tray shows an *Rx note* for strong prescriptions in large lenses or short lenses for progressives. **Optician to confirm thresholds** (§4). |

**Orders, prescriptions and lab tracking**

| Item | Status | Notes |
|---|---|---|
| Steps that reflect real status (D) | ✅ | *Paid, waiting for Rx · Pending approval · Preparing for the lab · At the lab · Arrived, to check · Ready for pickup*. |
| Reconcile "in review" vs "pending approval" (D vs R) | ✅ | Merged into one **Pending approval** stage. |
| Upload or take photo on an order awaiting Rx (R) | ✅ | Order detail → *Upload or take a photo of the Rx*. |
| Simplify awaiting-Rx and handle late uploads (R) | ✅ | Card shows "Day n · remind" at 14+; uploading attaches the Rx through Foundry's auto-attach. |
| Reminder at ~2 weeks for paid, no Rx (D) | 🟡 | *Send a reminder* with the template, logged on the timeline. Foundry's day 3/7/14 job only logs, it never sends (Foundry doc §3). |
| Match emailed prescriptions to a customer (D) | ⏳ Phase 3 | Needs a Foundry inbox matcher (Foundry doc §3). |
| Optician approval: notification, visible status, request action (R) | 🟡 | *Request approval* on the order (moves it to optician review + opens the request), Approvals inbox. Foundry never notifies on submit (event not emitted). |
| Replace the Excel tracker (D) | ✅ / 🟡 | *Tracker* view on Orders: client, item, purchase date, staff, stage, status. **Staff column is blank until Foundry returns it** (Foundry doc §2). Seren's spreadsheet still owed to check columns. |
| Flag orders past 10–12 business days (D) | ✅ | Business-day clock; "Running late" past 10, "Late" past 12; *Late* filter on Orders and on Floor. |
| Manual lab confirmation that triggers client messages (D) | 🟡 | *Lab confirmed* writes a note and opens the "lenses are being made" message. Foundry has no lab-confirmed field (Foundry doc §2). |
| Receiving check (D) | ✅ | Checklist when the box arrives: all good → ready + "ready" message; extras missing → note; anything else → redo. |
| Delayed or redo status (D) | ✅ / 🟡 | *Redo* uses Foundry's QC-fail move (counts redos) + delay message. *Delayed* is a note: no Foundry state. |
| Lab sync (D) | ❓ | Depends on the lab. |
| Scheduled invoice / pre-order (R) | ❓ | Grey area in both sessions. Not built. |

**Follow-ups**

| Item | Status | Notes |
|---|---|---|
| Real data (D) | ✔︎ | See §1. |
| One clear follow-up button (R) | ✅ | Follow-up card: primary *Follow up*; *Log a call* secondary. |
| What it's about and what was discussed (R) | ✅ | Frames liked, last visit and its notes, coming back for, signals. |
| Templates tied to outcomes (R) | ✅ | Shared template set (EN/FR), no discount language anywhere (tested). |
| Production update ~1 week after purchase (D) | 🟡 | Template exists; sending on a schedule needs Foundry (§3). |
| Delay message when a job is redone (D) | ✅ | Opens automatically after *Redo* / *Delayed*. |
| Campaign image with their frame (D) | ⏳ Later | |

### Phase 3 · Messages that send themselves (Foundry-dependent)

Goal: what staff open in Messages/Mail today goes out from Foundry, logged and translated.

1. Foundry: SMS to a customer without an existing thread; template API; send endpoint (Foundry doc §5).
2. iPad: `MessageSheet` switches from Messages/Mail links to the Foundry send endpoint when present (same templates, keys already match).
3. Awaiting-Rx day 3/7/14 and the ~1-week production update actually send (Foundry jobs exist, they only log).
4. Emailed prescriptions matched to customers (inbox matcher) with a staff confirm screen on the iPad.
5. Receipt timing at close (*Send now / Schedule / Print*) once receipts can hang off Rx orders.
6. Optician notified on approval request.

### Phase 4 · Profile depth and selling help

1. Measurements and handoff move from `customFields` to Foundry fields; per-tenant measurement template.
2. Wishlist tags.
3. Smart upsell (progressive detection from the Rx photo) — **only after the rules are written down** (below).
4. Lifestyle questionnaire workflow (feature exists; when to run it is undefined).
5. Multi-pair selling on top of the collection view.

### Phase 5 · Later

Loyalty, turnover analysis, compliance hardening (mostly Foundry DB), client portal smoothing, geolocation alerts (needs a customer app), campaign images.

---

## 3. Order stages: the reconciliation

| Foundry state(s) | Floor stage (EN / FR) |
|---|---|
| `awaiting_rx` | Paid, waiting for Rx / Payé, en attente d'ordonnance |
| `rx_submitted`, `optician_review` | Pending approval / En attente d'approbation |
| `ready_for_lab` | Preparing for the lab / Préparation pour le labo |
| `at_lab` | At the lab / Au labo |
| `received_from_lab` | Arrived, to check / Reçu, à vérifier |
| `ready_for_pickup`, `ready_to_ship` | Ready for pickup / Prêt à récupérer |

"Paid" is the store's word; Foundry has no paid flag (deposit only). If an order can be in `awaiting_rx` unpaid, Foundry needs a paid flag (Foundry doc §2).

## 4. Smart rules to write down before building

The checklist asks to write the process behind smart upsell first. Drafts for the optician to correct:

- **Rx fit flag (built, warning only):** strong minus (≤ −4.00) in a lens ≥ 52 mm; strong plus (≥ +3.00) in ≥ 52 mm; astigmatism ≥ 2.50 in ≥ 54 mm; progressive (ADD > 0) in a lens under 28 mm tall. Caution level at −6 / +5. Thresholds live in `src/features/visit/rxFit.ts`.
- **Progressive upsell (not built):** ADD present on the Rx photo → prompt "likely progressive wearer". The two progressive options and how to explain them: *optician to write*.
- **Second pair (built):** when exactly two frames are loved, prompt the free second-pair upgrade.
- **Style finder (built):** one store rule so far (funky + oversized → June). *Seren to list the rest.*

## 5. Open decisions (unchanged; each changes what gets built)

| Decision | Where it lands |
|---|---|
| Walk-in counter: everyone entering, or only people helped? | Both counted today; pick one for reports. |
| Try-on split-screen video emailed to the client? | Not built. |
| Scheduled invoices | Not built until confirmed. |
| Remote measurements / approval (legal) | Not pursued. |
| Lab sync | Waiting on the lab. |
| Wholesale terms affecting app access | Not an app task yet. |

## 6. Still owed (inputs)

- **App builder:** load the app on Seren's iPad (TestFlight build with this change). Add scheduled invoices to the feature list (done here, marked ❓).
- **Seren:** the order-tracking spreadsheet (to check the Tracker columns), the measurement field list, the style-finder rules.
- **Optician:** prototype feedback, the progressive explanation, the Rx fit thresholds.

## 7. Design and usability pass: what changed and why

- **Fewer places to start, one way to each thing.** Floor's four tiles replace a header button plus a rail; *New client* is in the tab bar everywhere.
- **Words from the store, not the system.** "Pending approval", "Paid, waiting for Rx", "Coming back for", "Send them their choices". Review → Approvals.
- **Nothing blocks the client.** Rx fit is a note, sunglasses don't need an Rx, a walk-in doesn't need a name, every configurator step is reachable.
- **Every message is preloaded, nothing sends by itself.** Staff see the text, edit it and send it from Messages/Mail; the contact is logged on Foundry.
- **Orders are a status board and a tracker.** Cards for "what needs me", a table for "the old spreadsheet", one detail sheet with the next action as the primary button.
- **API usability fixes found along the way:** client edits used `PATCH` but Foundry only has `PUT` (contact and tag edits failed); the "send summary" flag at visit end is accepted but never acted on (replaced by a real message). Both in the Foundry doc.

## 8. Simulator check (Nov 24, iPad Pro 13, lunettiq-demo)

Checked on the simulator, signed in to `lunettiq-demo`:

- **Works with live data:** Floor (funnel, 7 late orders named, pickups, 5 to remind, traffic counter), Orders cards and tracker, order detail with timeline, Rx photo sheet, Follow-ups (no discounts), follow-up card and message (EN and FR), Approvals, New client sheet from the tab bar (including "Start without a name"), visit File step, Measurements sheet, Find their style (funky + oversized puts June first), presentation screen, Tray sheet, profile handoff and collection, Clinical measurements.
- **Write verified end to end:** saving a handoff (Sunglasses, Travel) on Emma Côté. It went to Foundry and came back on the profile and in the header. That demo client keeps the note.
- **Fixed during the check:** an infinite re-render in the second-pair prompt that crashed the Frames step and Tray; an order timeline that showed blank "Flagged" rows (Foundry keeps event text in `payload`); visit header wrapping in portrait; uneven Floor tiles; cryptic "bd" badges; tracker dates wrapping.
- **Not exercised (would change demo data):** creating a guest client, adding frames to a tray (so Rx fit notes and the second-pair prompt with real frames), order transitions, approval request, Rx capture save, end-visit messages. Unit tests cover their logic and request bodies.
- **Seen, not caused here:** a visit for Emma Côté has been open for 836 hours on this simulator; demo catalogue products have no lens size metafields, so the Rx fit note won't show until they do.

# 14 — Golden Flows: Per-Screen Specs

**Companion to:** 12-design-system.md (components), 13-navigation-states.md (IDs, states)
**Template per screen:** Purpose · Entry/Exit · Layout · Data bindings · States · Interactions

Six flows. A, B, C, D are the happy path of a store day. E and F are the two paths the
earlier specs left unresolved (consent declined, handoff/privacy collisions).

---

## Flow A — Appointment Day: Today → Check-in → Session Start

### HOME-01 · Today

**Purpose:** SA lands here every unlock. Answer "what's next?" in under 3 seconds.
**Entry:** unlock, app open, end of session. **Exit:** any tab, appointment actions.

**Layout (landscape, 32 pt margins):**

- Left 762 pt: "Today" (`display-xl`) + date; vertical stack of AppointmentCards sorted by
  `startsAt`; past appointments collapse to single lines at the bottom.
- Right 492 pt, card stack: Active holds at this location (frames + which appointment);
  Recent clients (5 rows, avatar + name + last activity); quick actions grid 2×2
  (Search client · New client · Browse products · Second Sight).
- Manager role appends: session count today, Second Sight queue, designs pending review
  (doc 00 role homes).

**Data:** `GET /api/storefront/scheduling/appointments?date=today&locationId=` (5-min
refresh, cached offline); holds from `inventory_protections` reason `try_on_hold`;
recent clients from local WatermelonDB.

**States:** skeleton (card-shaped, max 2 s) · empty ("No appointments today" + line art +
"Browse products") · offline (cards render from cache, `caption` timestamp "As of 09:42")
· error (retry).

**Interactions:** Check in → status `in_progress`, card gains accent edge, holds panel
highlights that appointment's frames. Start session → SES-01. Long-press card → context
menu (No-show · View profile · Appointment detail). Pull-to-refresh.

### AppointmentCard check-in moment

Check-in triggers the intake-form hook (doc 06): `eye-exam` → Rx status banner on the
card ("Rx on file, expires 2027-03"); `second-sight` → primary action becomes "Start
Second Sight"; `styling` → preloads fit profile into the session it spawns.

### SES-01 · Session Workspace

**Purpose:** the consultation home. Client context always visible; catalogue, product
detail, or fitting occupies the working panel.
**Entry:** Start session (HOME-01, CLI-02, APPT-02). **Exit:** End session flow; tab
switch (session persists via chip).

**Layout:** landscape only (doc 11). Left 762 pt: contextual host — defaults to PRD-01 in
client-context mode ("Browsing for Marie" header + scored sort + FitBadges). Right 492 pt:
ClientContextPanel. TopBar gains session chip with live duration. Primary action in
TopBar: "Start fitting" (accent — the screen's one green).

**Data:** profile `GET /api/clients/{id}`; suggestions `GET /api/clients/{id}/suggestions?limit=12`;
AI Stylist on demand `POST /api/clients/{id}/ai-styler` (button in panel; offline →
disabled with "Needs connection" caption).

**States:** panel skeleton · first-visit client (panel shows fit profile empty-state:
"No measurements yet — add during fitting") · offline (suggestions fall back to cached
scores, labelled "cached") · portrait rotation → panel collapses to top chip.

**Interactions:** every panel section tap-to-edit inline (doc 02); session notes always
editable, autosave 30 s; AI Stylist returns thought + chips — chip tap executes (opens
product, adds note).

---

## Flow B — Browse for Client → Product Detail → Fit Check

### PRD-01 · Product Browser (session context)

**Purpose:** find the right frames for this client fast.
**Layout:** search bar + FilterPillRow; grid 4 cols landscape / 3 portrait, 16 pt gap;
ProductCards with FitBadge + StockDot; sort defaults to Best match; owned products
de-emphasized; avoid-list filtered with "Show anyway" pill (doc 03).
**Data:** local WatermelonDB catalogue (<150 ms, doc 11); scores from suggestions API.
**States:** skeleton grid · no results ("Nothing matches — clear filters?") · offline
(full function, network-only filters disabled).
**Interactions:** card tap → PRD-02 sheet; long-press → quick actions (Recommend ·
Wishlist); barcode button → PRD-03.

### PRD-02 · Product Detail (sheet, 70% → full)

**Layout top-to-bottom:** hero carousel (full-bleed, colour variant chips below);
identity block (family name `display-l`, collection `label`, price `price`); fit check
band when session active — "Good fit for Marie" with the visual range bar (client ideal
range vs this frame, doc 03); dimensions table (`mono` values); material/details;
inventory (staff mode: this location table + other locations expandable + active
protections); ActionBar: Try in fitting (primary when session active) · Wishlist ·
Recommend · overflow.

**Privacy:** client-visible hides price (tap-to-reveal), inventory, sales history,
protections. Fit check band stays — it is about the client.

**States:** loading skeleton inside sheet · variant out of stock (chip greyed + StockDot)
· no session (ActionBar → "Start a session to recommend").

**Interactions:** "Try in fitting" — if FITTING active, adds frame to shelf pre-linked
and dismisses sheet with confirmation haptic; if SESSION, starts FIT-01 with this frame
queued as the expected first link.

---

## Flow C — Fitting: Consent → Capture → Link → Verdict → Compare

### FIT-04 · Consent Modal

Fires on first capture attempt, not on fitting start — asking at the moment of the first
photo is more natural for the SA script. Bilingual toggle. Two equal-weight outcomes:
"Client agrees" → `consentCapturedAt` logged, camera ready. "No photos this session" →
`consentDeclined` logged → FIT-01 switches to no-photo layout (Flow E). Not dismissable
by tap-outside; Cancel returns to SES-01.

### FIT-01 · Fitting Mode

**Purpose:** capture what the client tried with zero friction. Camera is the screen.
**Entry:** Start fitting (SES-01, PRD-02). **Exit:** End fitting → SES-01; End session →
SES-02 (with unlinked-photo check first).

**Layout:** full-bleed camera feed (TabBar hidden, TopBar minimal: exit chevron, client
name, photo count `14/20` in `mono`). CaptureButton 72 pt right-edge centred. Barcode
toggle bottom-left. Shelf: bottom strip, 96 pt tall, `surface-sunken`, horizontal scroll
of ShelfThumbnails, "Compare" button appears when 2+ selected.

**Camera decision (new, resolves open gap):** rear camera default (quality, natural
SA-holds-iPad posture) with a **mirror toggle** that shows the client a mirrored preview —
front camera drops quality and puts the client's eyes on themselves instead of the SA.
Guide overlay 30% opacity, disappears during capture.

**Capture sequence:** shutter → burst 3, sharpest wins (<500 ms to thumbnail) → link
prompt as a non-blocking bottom card: Scan barcode · Search (typeahead, 2–3 chars) ·
Skip (unlinked badge). Thumbnail springs into shelf. If frame was queued from PRD-02,
link is pre-filled — confirm with one tap.

**States:** ready · capturing · processing · cap-reached (shutter disabled, "20 photo
limit — end fitting to start a new session") · low-light (exposure hint caption) ·
uploading (per-thumbnail progress rings; cellular → queued per doc 08).

### FIT-02 · Frame Detail Popover

Photo large (pinch-zoom), product name + re-link, notes field (this is the one place
typing is expected — keyboard appears with dictation button prominent), VerdictControl,
shortlist star (creates 48 h hold — confirmation toast "Held until Thu 14:00"), delete
(confirm alert).

### FIT-03 · Compare View

2-up side-by-side / 3–4 grid. Each cell: photo, name, verdict, notes caption. Actions
per cell: "This one" (shortlist + accent flash) · verdict change inline. Global: "Show
more" back to camera, "Done". Assemble animation 300 ms spring; Reduce Motion →
crossfade. This is the screen the client stares at — client-visible rules apply
automatically to it regardless of mode toggle (no prices, no stock, no notes flagged
internal).

---

## Flow D — End Session: Outcome → Summary → Notes

Sheet with 3 steps, step indicator, back allowed.

### SES-02 · Outcome

Four large option cards (single tap advances): Purchased · Booked next visit ·
Shortlist to review · Left empty-handed. Purchased → order-link field: scan receipt
barcode / pick from today's POS orders when API allows / "link later" (creates a
follow-up task — never blocks the SA at the moment the client is leaving).

### SES-03 · Summary Email

Preview of the actual email (doc 04 template) populated live: shortlisted frames with
photos, verdicts as plain language, held-until dates. Editable subject + intro line.
Language selector EN/FR defaulting to client's stored preference. Toggle "Send summary"
default on (consent captured at session start, doc 00 decision 4). Consent-declined
sessions: email sends without photos, listing frame names only.

### SES-04 · Internal Notes

Staff-only free text + quick-tag chips (follow up · price sensitive · bring spouse ·
size up). Saves session → `POST .../tryon-sessions/{id}/end` → timeline entry →
return HOME-01 with toast "Session saved · 6 frames · summary sent".

---

## Flow E — Consent Declined (no-photo fitting)

Same FIT-01 chrome, camera replaced by a **frame logging canvas**: large typeahead +
barcode button ("What is Marie trying?"), and the shelf fills with no-photo
ShelfThumbnails (product image from catalogue as the visual, small `camera.slash`
marker). Everything else is identical — verdicts, notes, shortlist, compare (compare
uses catalogue product images). Session data model unchanged; `framesTried[].photos`
stays empty. Summary email uses catalogue imagery. The SA experience degrades by one
notch, not to zero — this keeps the data pipeline (verdicts → suggestions algorithm)
alive for the ~significant fraction of clients who decline.

---

## Flow F — Shift Handoff & Privacy Collisions

### AUTH-03 · Shift Handoff (any state)

Sheet: "Pass to a colleague" → colleague biometric → banner on return "Continuing
Marie's session · started by Alex, 10:07". Work context and view mode preserved.
Attribution flips at handoff timestamp (doc 01). If invoked during FITTING, camera
pauses (privacy) and resumes after biometric.

### FIT-05 · Hand to Client (HANDED)

Entry: "Hand to client" from fitting or session. Chrome: TabBar and TopBar gone;
ModeStrip locked to client colour; single exit affordance (double-tap top edge →
biometric → STAFF). Content: photo shelf large, tap to enlarge, VerdictControl in
client-voice mode (client verdicts get the person marker). 10-minute handed-timeout →
"Pass back to staff" holding screen (blank canvas + logo, biometric to continue) —
replaces the 2-minute lock which would strand the client (13 §1 interrupt rules).

### Collision matrix (QA checklist)

| Situation | Resolution |
|---|---|
| 2-min lock during FITTING | Suppressed (camera keeps device awake) |
| 2-min lock during HANDED | Replaced by 10-min handed-timeout |
| Handoff during HANDED | Allowed; biometric is the staff gate; stays HANDED after |
| Privacy toggle during FITTING | Allowed; affects shelf metadata (notes hide) |
| Toggle to staff during HANDED | Impossible — toggle locked; exit gesture is the only path |
| Offline during end-session email | Email queues; step completes; toast "will send when online" |
| Photo cap mid-burst | Burst completes, then shutter disables |
| App killed during HANDED | Relaunch → biometric → resume prompt → restores as STAFF (13 §1 rule 1) |

---

## Coverage

Flows A–F spec 19 of 28 V1 screens in full. Remaining nine (AUTH-01/02, SYS-01/02/03,
CLI-01/03/04, APPT-01) are conventional and fully derivable from the component library;
spec them in the next pass or directly in Figma using the same template.

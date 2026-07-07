---
inclusion: manual
---
# Screen Specs — Golden Flows

Reference: "use #16-screen-specs"

## Overview

The 6 golden flows that define the core iPad experience. Each screen spec includes:
- **Purpose**: Why this screen exists
- **Entry/Exit**: Navigation paths in/out
- **Layout**: Component structure and spacing
- **Data bindings**: API calls and local data
- **States**: Loading, error, empty, offline handling
- **Interactions**: Touch gestures and state changes

## Flow A — Appointment Day: Today → Check-in → Session Start

### HOME-01 · Today

**Purpose:** SA lands here every unlock. Answer "what's next?" in under 3 seconds.

**Entry/Exit:**
- Entry: app unlock, session end, tab switch to Home
- Exit: any tab navigation, appointment actions, start session

**Layout (landscape, 32pt margins):**
- Left 762pt: "Today" heading + date, vertical stack of AppointmentCards sorted by `startsAt`, past appointments collapsed
- Right 492pt: Active holds card, Recent clients (5 rows), Quick actions grid 2×2 (Search client, New client, Browse products, Second Sight)
- Manager role adds: session count, Second Sight queue, designs pending

**Data bindings:**
```typescript
GET /api/storefront/scheduling/appointments?date=today&locationId=
GET /api/admin/inventory-protections?reason=try_on_hold
// Local: recent clients from WatermelonDB
```

**States:**
- Skeleton: card-shaped loading max 2s
- Empty: "No appointments today" + illustration + "Browse products" CTA
- Offline: cards from cache with "As of 09:42" timestamp
- Error: retry button with error message

**Interactions:**
- Check in → appointment status `in_progress`, accent edge, highlight holds
- Start session → SES-01
- Long-press card → context menu (No-show, View profile, Appointment detail)
- Pull-to-refresh

### SES-01 · Session Workspace

**Purpose:** Consultation home with client context always visible.

**Entry/Exit:**
- Entry: Start session (HOME-01, CLI-02, APPT-02)
- Exit: End session flow, tab switch (session persists via chip)

**Layout (landscape only):**
- Left 762pt: PRD-01 product browser with "Browsing for {client}" header, scored sort, FitBadges
- Right 492pt: ClientContextPanel
- TopBar: session chip with live duration, "Start fitting" primary action

**Data bindings:**
```typescript
GET /api/admin/clients/{id}
GET /api/admin/clients/{id}/suggestions?limit=12
POST /api/admin/clients/{id}/ai-styler  // on-demand
```

**States:**
- Panel skeleton loading
- First-visit client: fit profile empty-state "No measurements yet"
- Offline: suggestions from cached scores, labeled "cached"
- Portrait: panel collapses to top chip

**Interactions:**
- Panel sections: tap-to-edit inline
- Session notes: always editable, autosave 30s
- AI Stylist: returns thought + chips, chip tap executes

## Flow B — Browse → Product Detail → Fit Check

### PRD-01 · Product Browser (session context)

**Purpose:** Find the right frames for this client fast.

**Entry/Exit:**
- Entry: session workspace default, tab navigation
- Exit: product detail sheet, barcode scan

**Layout:**
- Search bar + FilterPillRow
- Grid: 4 cols landscape / 3 portrait, 16pt gap
- ProductCards with FitBadge + StockDot
- Sort: "Best match" default, owned products de-emphasized

**Data bindings:**
```typescript
// Local WatermelonDB catalogue (<150ms response)
// Scores from suggestions API
```

**States:**
- Skeleton grid
- No results: "Nothing matches — clear filters?"
- Offline: full function, network-only filters disabled

**Interactions:**
- Card tap → PRD-02 sheet
- Long-press → quick actions (Recommend, Wishlist)
- Barcode button → PRD-03

### PRD-02 · Product Detail (sheet, 70% → full)

**Purpose:** Complete product information with fit context.

**Entry/Exit:**
- Entry: product card tap, barcode scan result
- Exit: sheet dismiss, "Try in fitting" action

**Layout (top-to-bottom):**
- Hero carousel: full-bleed, color variant chips
- Identity block: family name, collection, price
- Fit check band: "Good fit for {client}" with range bar
- Dimensions table with mono font values
- Material/details section
- Inventory: location table + protections (staff-only)
- ActionBar: Try in fitting (primary), Wishlist, Recommend, overflow

**Data bindings:**
```typescript
GET /api/admin/products/{id}
// Fit calculations from client profile + product dimensions
```

**States:**
- Loading skeleton inside sheet
- Variant out of stock: greyed chip + StockDot
- No session: ActionBar shows "Start a session to recommend"

**Interactions:**
- Privacy mode: hides price (tap-to-reveal), inventory, sales history
- "Try in fitting": adds to shelf if FITTING active, starts FIT-01 if SESSION

## Flow C — Fitting: Consent → Capture → Link → Verdict → Compare

### FIT-04 · Consent Modal

**Purpose:** Photo consent at moment of first capture.

**Entry/Exit:**
- Entry: first capture attempt in session
- Exit: consent granted → camera ready, declined → no-photo mode

**Layout:**
- Non-dismissable modal
- Bilingual toggle
- Two equal buttons: "Client agrees" / "No photos this session"

**Data bindings:**
```typescript
// Logs consentCapturedAt or consentDeclined
```

**Interactions:**
- Cannot dismiss by tap-outside
- Cancel returns to SES-01

### FIT-01 · Fitting Mode

**Purpose:** Capture what client tried with zero friction.

**Entry/Exit:**
- Entry: Start fitting (SES-01, PRD-02)
- Exit: End fitting → SES-01, End session → SES-02

**Layout:**
- Full-bleed camera feed
- TopBar minimal: exit chevron, client name, photo count "14/20"
- CaptureButton: 72pt, right-edge centered
- Barcode toggle: bottom-left
- Shelf: bottom strip 96pt tall, horizontal scroll, "Compare" button when 2+ selected

**Camera configuration:**
- Rear camera default with mirror toggle for client preview
- Guide overlay 30% opacity, disappears during capture
- Burst: 3 frames, sharpest wins, <500ms to thumbnail

**Data bindings:**
```typescript
// Photo capture → local storage → upload queue
// Link prompt: barcode scan, search typeahead, or skip
```

**States:**
- Ready, capturing, processing
- Cap reached: "20 photo limit" with disabled shutter
- Low-light: exposure hint
- Uploading: progress rings per thumbnail

**Interactions:**
- Capture sequence: shutter → burst → link prompt → shelf thumbnail
- Pre-queued frames from PRD-02 auto-link with confirmation

### FIT-02 · Frame Detail Popover

**Purpose:** Photo review and metadata entry.

**Layout:**
- Large photo with pinch-zoom
- Product name + re-link option
- Notes field with dictation button
- VerdictControl
- Shortlist star (creates 48h hold)
- Delete with confirmation

**Interactions:**
- Shortlist → confirmation toast "Held until Thu 14:00"
- Notes field expects typing, keyboard with dictation prominent

### FIT-03 · Compare View

**Purpose:** Side-by-side frame comparison for client decision.

**Entry/Exit:**
- Entry: "Compare" from shelf (2+ photos)
- Exit: "Show more" to camera, "Done" to session

**Layout:**
- 2-up side-by-side or 3-4 grid
- Per cell: photo, name, verdict, notes caption
- Actions: "This one" (shortlist + flash), verdict change inline

**Data bindings:**
- Client-visible rules auto-apply (no prices, stock, internal notes)

**Interactions:**
- Assemble animation 300ms spring (crossfade for Reduce Motion)
- "This one" creates shortlist with accent flash

## Flow D — End Session: Outcome → Summary → Notes

### SES-02 · Outcome

**Purpose:** Categorize session result for follow-up.

**Layout:**
- Four large option cards (single tap advances)
- Options: Purchased, Booked next visit, Shortlist to review, Left empty-handed
- Purchased → order-link field with barcode scan option

**Interactions:**
- Card tap advances to next step
- Order linking: scan receipt, pick from POS orders, or "link later"

### SES-03 · Summary Email

**Purpose:** Preview and customize client email.

**Layout:**
- Live email preview with shortlisted frames + photos + verdicts
- Editable subject + intro line
- Language selector EN/FR (defaults to client preference)
- "Send summary" toggle (default on if consent captured)

**Data bindings:**
- Email template populated from session data
- Consent-declined sessions: frame names only, no photos

### SES-04 · Internal Notes

**Purpose:** Staff-only session documentation.

**Layout:**
- Free text area
- Quick-tag chips: follow up, price sensitive, bring spouse, size up
- Save → timeline entry creation

**Data bindings:**
```typescript
POST /api/admin/tryon-sessions/{id}/end
// Creates timeline entry, returns to HOME-01 with confirmation toast
```

## Flow E — Consent Declined (no-photo fitting)

### Modified FIT-01 · No-Photo Mode

**Purpose:** Frame tracking without photos when consent declined.

**Layout:**
- Same chrome as FIT-01
- Camera replaced by frame logging canvas
- Large typeahead + barcode button "What is Marie trying?"
- Shelf uses catalogue images with camera.slash marker

**Data bindings:**
- Product lookup via typeahead or barcode
- `framesTried[].photos` stays empty
- Summary email uses catalogue imagery

**Interactions:**
- Verdicts, notes, shortlist all function normally
- Compare view uses product catalogue images

## Flow F — Shift Handoff & Privacy Collisions

### AUTH-03 · Shift Handoff

**Purpose:** Transfer session between staff members.

**Layout:**
- Sheet: "Pass to a colleague"
- Biometric prompt
- Banner on return: "Continuing Marie's session · started by Alex, 10:07"

**Data bindings:**
- Attribution flips at handoff timestamp
- Work context and view mode preserved

**Interactions:**
- If during FITTING: camera pauses until biometric complete

### FIT-05 · Hand to Client (HANDED mode)

**Purpose:** Client self-service photo review.

**Entry/Exit:**
- Entry: "Hand to client" from fitting or session
- Exit: double-tap top edge → biometric → STAFF mode

**Layout:**
- TabBar and TopBar hidden
- ModeStrip locked to client color
- Photo shelf large, tap to enlarge
- VerdictControl in client-voice mode

**States:**
- 10-minute timeout → "Pass back to staff" holding screen

**Interactions:**
- Client verdicts get person marker
- Only exit: double-tap gesture → biometric

### Collision Resolution Matrix

| Situation | Resolution |
|-----------|------------|
| 2-min lock during FITTING | Suppressed (camera keeps awake) |
| 2-min lock during HANDED | Replaced by 10-min timeout |
| Handoff during HANDED | Allowed, stays HANDED after biometric |
| Privacy toggle during FITTING | Allowed, affects shelf metadata visibility |
| Toggle to staff during HANDED | Impossible — locked, exit gesture only |
| Offline during end-session email | Email queues, toast "will send when online" |
| Photo cap mid-burst | Burst completes, then shutter disables |
| App killed during HANDED | Relaunch → biometric → resume as STAFF |

## Implementation Rules

1. **Every screen handles 4 states**: loading, error, empty, content
2. **Privacy mode auto-applies** to client-facing screens (FIT-03, FIT-05)
3. **Touch targets minimum 44pt** on all interactive elements
4. **Text minimum 17pt** (20pt in client-visible mode)
5. **Offline graceful degradation** — never block core flows
6. **Camera permissions** required for FIT-01, graceful fallback to FIT-01 no-photo mode
7. **Biometric gates** for staff-only actions and handoff recovery
8. **Session persistence** across tab switches and app backgrounds
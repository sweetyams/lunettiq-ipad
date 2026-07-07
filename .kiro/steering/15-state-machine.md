---
inclusion: manual
---
# State Machine & Navigation

Reference: "use #15-state-machine"

## App Mode State Machine

The app operates on two orthogonal state dimensions that resolve all mode collision questions.

### Dimension A — Work Context (Where the SA is)

```
                    ┌─────────────┐
        ┌──────────►│    IDLE     │◄─────────┐
        │           │ (no client) │          │
        │           └──────┬──────┘          │
   end session             │ start session   │ end session
        │           ┌──────▼──────┐          │
        │           │   SESSION   │──────────┘
        │           │ (client set)│
        │           └──────┬──────┘
        │                  │ start fitting ▲ end fitting
        │           ┌──────▼──────┐
        └───────────│   FITTING   │
                    └─────────────┘
```

**Transition Rules:**
- IDLE → SESSION: requires a client (appointment, search, or check-in)
- FITTING: only reachable from SESSION, always returns to SESSION
- Ending session from FITTING: runs end-fitting checks first (unlinked photos prompt), then end-session flow
- Discovery mode (V2): fourth state parallel to SESSION with `clientId = null`

### Dimension B — View Mode (Who is looking)

```
  STAFF ◄──── one tap ────► CLIENT-VISIBLE ──"Hand to client"──► HANDED
    ▲                                                              │
    └────────────── double-tap + biometric ◄───────────────────────┘
```

**Transition Rules:**
- STAFF ↔ CLIENT-VISIBLE: free, instant, one tap either way
- HANDED: client-visible + simplified chrome + TabBar hidden
- Exit HANDED: requires biometric authentication
- Any work context can combine with any view mode
- Exception: Settings and sync detail unreachable outside STAFF mode

## Interrupt Precedence Table

| Priority | Interrupt | Rule |
|----------|-----------|------|
| 1 | Crash/force quit | Session persisted every 30s; resume prompt on relaunch; view mode resets to STAFF |
| 2 | Screen lock (2min) | **SUPPRESSED in FITTING and HANDED** — clients must never hit Face ID wall |
| 3 | Shift handoff | Preserves work context + view mode; shows continuation banner |
| 4 | App session timeout (30min) | Only applies in IDLE; suppressed in SESSION/FITTING |
| 5 | Offline transition | Never changes state; shows SyncIndicator + queued writes |
| 6 | Photo cap (20) | FITTING stays active; shutter disables; other actions continue |

**Critical Security Note:** Screen lock suppression in FITTING is bounded by the session itself — ending the session re-arms the 2-minute lock timer.

## Screen Inventory (V1)

Canonical IDs for Figma frames, analytics events, and QA plans.

### Auth & System
- **AUTH-01:** Clerk sign-in (first open, 14-day expiry)
- **AUTH-02:** Biometric unlock (every open, screen lock)
- **AUTH-03:** Shift handoff (colleague transfer)
- **SYS-01:** First-run sync (after initial sign-in)
- **SYS-02:** Sync status (tap SyncIndicator)
- **SYS-03:** Settings (manager+ only, staff-mode only)

### Home & Appointments
- **HOME-01:** Today view (role-aware home, tab root)
- **APPT-01:** Week view (appointments tab)
- **APPT-02:** Appointment detail (popover from card)

### Clients
- **CLI-01:** Client search/list (tab root, global search)
- **CLI-02:** Client profile (from row tap, appointment card)
- **CLI-03:** New client (sheet from "+", end of discovery)
- **CLI-04:** Duplicate resolution (inline in CLI-03)

### Products
- **PRD-01:** Product browser (tab root, session left panel)
- **PRD-02:** Product detail (sheet 70%/full from card tap)
- **PRD-03:** Barcode scanner (full-screen camera)

### Session & Fitting
- **SES-01:** Session workspace (landscape, from "Start session")
- **SES-02:** End session — outcome (sheet step 1)
- **SES-03:** End session — summary email (sheet step 2)
- **SES-04:** End session — internal notes (sheet step 3)
- **FIT-01:** Fitting mode (full screen from "Start fitting")
- **FIT-02:** Frame detail popover (shelf thumbnail tap)
- **FIT-03:** Compare view (select 2-4 + "Compare")
- **FIT-04:** Consent modal (first capture attempt per session)
- **FIT-05:** Hand-to-client review (HANDED mode)

### Second Sight & Custom Design
- **SSI-01 to SSI-06:** Intake steps (identify, photos, grade, credit, decision, done)
- **CDX-01 to CDX-05:** Custom design steps (reference, modifications, measurements, quote, submit)

**Total: 28 V1 screens**

## Navigation Map

```
TabBar (persistent except FITTING, HANDED, guided flows)
│
├─ Home ──── HOME-01 ─┬─ APPT-02 (popover)
│                     └─ SES-01 (via Start session)
├─ Clients ─ CLI-01 ──┬─ CLI-02 ─┬─ SES-01
│                     │          ├─ SSI-01…06
│                     │          └─ CDX-01…05
│                     └─ CLI-03 (sheet)
├─ Products  PRD-01 ──┬─ PRD-02 (sheet) ─── SES-01 ("Try in fitting")
│                     └─ PRD-03 (camera)
├─ Appts ─── APPT-01 ─ APPT-02
└─ More ──── SSI queue · CDX drafts · SYS-02 · SYS-03 (role-gated)

SES-01 ─┬─ left panel hosts PRD-01/PRD-02 inline (session context)
        ├─ FIT-01 ─┬─ FIT-02 (popover)
        │          ├─ FIT-03 (compare)
        │          ├─ FIT-04 (consent, once)
        │          └─ FIT-05 (handed)
        └─ SES-02 → SES-03 → SES-04 → back to HOME-01
```

### Navigation Rules

1. **Guided flows** (SSI, CDX, end-session): linear with step indicator; back allowed, skip not; abandoning prompts save-as-draft
2. **Session persistence**: survives tab switches; persistent session chip in TopBar ("Session · Marie D. · 12 min")
3. **Context-aware actions**: PRD-02 in session shows session actions (wishlist, recommend, try in fitting); outside session shows "Start a session to recommend"

## Global Chrome Rules

| Chrome Element | IDLE | SESSION | FITTING | HANDED |
|----------------|------|---------|---------|--------|
| **ModeStrip** | ✓ | ✓ | ✓ | ✓ (client colour) |
| **TabBar** | ✓ | ✓ | — | — |
| **TopBar** | ✓ | ✓ + session chip | minimal (exit + count) | — (exit gesture only) |
| **SyncIndicator** | ✓ | ✓ | ✓ | — |
| **PrivacyToggle** | ✓ | ✓ | ✓ | — (locked to client) |

### Chrome Rules

- **ModeStrip:** Always visible, changes color in HANDED mode
- **TabBar:** Hidden in FITTING and HANDED modes
- **TopBar:** Progressively simplified; completely hidden in HANDED
- **SyncIndicator:** Hidden only in HANDED mode (no tech details for clients)
- **PrivacyToggle:** Disabled in HANDED (locked to client-visible)
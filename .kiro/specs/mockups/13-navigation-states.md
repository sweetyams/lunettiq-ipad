# 13 — Navigation, Screens & State Machine

**Companion to:** 12-design-system.md
**Scope:** V1 surface. V2 screens listed but not specced.

---

## 1. App Mode State Machine

Two orthogonal state dimensions. Keeping them separate resolves every mode-collision
question in the earlier specs.

### Dimension A — Work context (where the SA is)

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

- IDLE → SESSION requires a client (appointment, search, or check-in).
- FITTING is only reachable from SESSION and always returns to SESSION.
- Ending a session from FITTING runs the end-fitting checks first (unlinked photos
  prompt — doc 04), then the end-session flow.
- Discovery mode (V2) will be a fourth state parallel to SESSION with `clientId = null`.

### Dimension B — View mode (who is looking)

```
  STAFF ◄──── one tap ────► CLIENT-VISIBLE ──"Hand to client"──► HANDED
    ▲                                                              │
    └────────────── double-tap + biometric ◄───────────────────────┘
```

- STAFF ↔ CLIENT-VISIBLE: free, instant, one tap either way.
- HANDED = client-visible + simplified chrome + TabBar hidden. Exit requires biometric.
- Any work-context state can combine with any view mode, except: Settings and sync detail
  are unreachable outside STAFF.

### Interrupt precedence (highest first)

| # | Interrupt | Rule |
|---|---|---|
| 1 | Crash / force quit | Session state persisted every 30 s; resume prompt on relaunch (doc 02). Resume restores both dimensions except view mode, which always restarts as STAFF. |
| 2 | Screen lock (2 min) | **Suppressed in FITTING and HANDED.** A client holding the iPad must never hit a Face ID wall. In HANDED, lock timer is replaced by a 10-min handed-timeout that returns to a "Pass back to staff" holding screen (no data visible, biometric to continue). In FITTING, camera-active keeps the device awake. |
| 3 | Shift handoff | Allowed in any state. Preserves work context and view mode; shows continuation banner (doc 01). Attribution switches from the handoff timestamp. |
| 4 | App session timeout (30 min) | Suppressed while SESSION or FITTING active. Applies only in IDLE. |
| 5 | Offline transition | Never changes state. SyncIndicator + queued writes only. AI Stylist and scored sort degrade to cached/local (labelled "cached"). |
| 6 | Photo cap (20) | FITTING remains active; shutter disables; all other fitting actions continue. |

The screen-lock suppression rules (#2) are new decisions — they resolve the collision the
earlier specs left open. Flag for security review: suppression in FITTING is bounded by
the session itself; ending the session re-arms the 2-minute lock.

---

## 2. Screen Inventory (V1)

IDs are canonical — use in Figma frames, analytics events, and QA plans.

### Auth & system

| ID | Screen | Type | Entry |
|---|---|---|---|
| AUTH-01 | Clerk sign-in | Full screen | First open, 14-day expiry |
| AUTH-02 | Biometric unlock | Overlay | Every open, screen lock |
| AUTH-03 | Shift handoff | Sheet (medium) | "Pass to colleague" |
| SYS-01 | First-run sync | Full screen | After first sign-in (≤60 s, progress + what's downloading) |
| SYS-02 | Sync status | Popover | Tap SyncIndicator |
| SYS-03 | Settings | Full screen | More tab (manager+; staff-mode only) |

### Home & appointments

| ID | Screen | Type | Entry |
|---|---|---|---|
| HOME-01 | Today (role-aware home) | Tab root | Home tab |
| APPT-01 | Week view | Full screen | Appointments tab |
| APPT-02 | Appointment detail | Popover | Tap card body |

### Clients

| ID | Screen | Type | Entry |
|---|---|---|---|
| CLI-01 | Client search / list | Tab root | Clients tab, global search |
| CLI-02 | Client profile | Full screen | Row tap, appointment card |
| CLI-03 | New client | Sheet (full) | "+", end of discovery (V2) |
| CLI-04 | Duplicate resolution | Inline in CLI-03 | Real-time match |

### Products

| ID | Screen | Type | Entry |
|---|---|---|---|
| PRD-01 | Product browser | Tab root | Products tab, session left panel |
| PRD-02 | Product detail | Sheet 70% / full | Card tap |
| PRD-03 | Barcode scanner | Full-screen camera | Scan action (browser, fitting, Second Sight) |

### Session & fitting

| ID | Screen | Type | Entry |
|---|---|---|---|
| SES-01 | Session workspace | Full screen (landscape) | "Start session" |
| SES-02 | End session — outcome | Sheet step 1 | "End session" |
| SES-03 | End session — summary email | Sheet step 2 | After outcome |
| SES-04 | End session — internal notes | Sheet step 3 | After email |
| FIT-01 | Fitting mode | Full screen | "Start fitting" |
| FIT-02 | Frame detail popover | Popover | Shelf thumbnail tap |
| FIT-03 | Compare view | Full screen | Select 2–4 + "Compare" |
| FIT-04 | Consent modal | Modal | First capture attempt per session |
| FIT-05 | Hand-to-client review | Full screen (HANDED) | "Hand to client" |

### Second Sight & custom design

| ID | Screen | Type | Entry |
|---|---|---|---|
| SSI-01…06 | Intake steps 1–6 (identify, photos, grade, credit, decision, done) | Guided full-screen flow | Profile action, More tab |
| CDX-01…05 | Custom design steps (reference, modifications, measurements, quote, submit) | Guided full-screen flow | Profile action, product detail |

V2 screens (inventoried, not specced): DIS-01 discovery mode, FIT-06 Pencil annotation,
PRD-04 configurator, APPT-03 QR check-in.

**Count: 28 V1 screens.** Six flows in doc 14 cover 19 of them; the remainder follow the
same component grammar.

---

## 3. Navigation Map

```
TabBar (persistent except FITTING, HANDED, guided flows)
│
├─ Home ──── HOME-01 ─┬─ APPT-02 (popover)
│                     └─ SES-01 (via Start session)
├─ Clients ─ CLI-01 ──┬─ CLI-02 ─┬─ SES-01
│                     │          ├─ SSI-01…06
│                     │          └─ CDX-01…05
│                     └─ CLI-03 (sheet)
├─ Products  PRD-01 ──┬─ PRD-02 (sheet) ─── SES-01 ("Try in fitting" when session active)
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

Rules:

- Guided flows (SSI, CDX, end-session) are linear with a persistent step indicator;
  back is allowed, skip is not; abandoning prompts save-as-draft.
- A session survives tab switches. Leaving SES-01 via TabBar shows a persistent session
  chip in the TopBar of every screen ("Session · Marie D. · 12 min") — tap to return.
  Sessions are never silently abandoned.
- PRD-02 opened inside a session gets session actions (wishlist, recommend, try in
  fitting); opened from Products tab without a session it shows "Start a session to
  recommend" in the ActionBar.

---

## 4. Global Chrome Rules

| Chrome | IDLE | SESSION | FITTING | HANDED |
|---|---|---|---|---|
| ModeStrip | ✓ | ✓ | ✓ | ✓ (client colour) |
| TabBar | ✓ | ✓ | — | — |
| TopBar | ✓ | ✓ + session chip | minimal (exit + count) | — (exit gesture only) |
| SyncIndicator | ✓ | ✓ | ✓ | — |
| PrivacyToggle | ✓ | ✓ | ✓ | — (locked to client) |

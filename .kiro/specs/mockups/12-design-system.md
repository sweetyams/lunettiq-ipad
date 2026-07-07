# 12 — Design System

**Companion to:** 00-overview.md through 11-performance-ux.md (canonical set)
**Supersedes:** visual guidance in `lunettiq-ipad-app-spec.md` §17.3 and the four page specs
**Design canvas:** iPad Pro 12.9" — 1366 × 1024 pt landscape, 1024 × 1366 pt portrait

---

## 1. Design Language — The Hybrid Rule

The app should feel like a first-party Apple app wearing Lunettiq's clothes. One sentence
decides every argument: **structure and behaviour are iOS-native; content and identity are
Lunettiq.**

### What stays native (never rebrand)

| Element | Native pattern |
|---|---|
| Sheets and modals | UIKit-style detent sheets, grabber handle, pull-down to dismiss |
| Navigation transitions | Standard push/pop, sheet spring, no custom easing |
| Bars | Blur material (`systemChromeMaterial` equivalent), hairline border |
| Icons | SF Symbols only, weight-matched to adjacent text |
| Controls | Native switches, segmented controls, context menus, date pickers |
| Keyboard, focus, selection | System behaviour untouched |
| Haptics and sounds | System haptics per doc 11 §Haptics |

### What gets branded (never system-default)

| Element | Lunettiq treatment |
|---|---|
| Headings, product names, prices | Helvetica Now Display |
| Body and UI labels | Helvetica Neue |
| Accent and semantic colours | Brand tokens (§2) |
| Photography treatment | Editorial, full-bleed where possible, no borders on images |
| Empty-state illustrations | Brand line-art style |
| Buttons | Brand-filled, 10 pt radius, no system tint blue anywhere |

### Three quality bars

1. **Nothing decorative moves.** Motion only communicates state or hierarchy (§7).
2. **One accent per screen.** Green (`accent`) appears only on the single most important
   affirmative action visible. Everything else is navy or neutral.
3. **Photography is the interface.** Product and fitting photos get maximum area; chrome
   shrinks around them. When a screen contains a photo, the photo wins every layout fight.

---

## 2. Colour Tokens

Semantic tokens only — components never reference hex directly. Light mode is default
(doc 11); dark values included for completeness.

### Core

| Token | Light | Dark | Usage |
|---|---|---|---|
| `ink` | #0A153D | #F5F2EC | Primary text, filled primary buttons |
| `ink-secondary` | #5C5C5C | #A8A8B8 | Metadata, captions, secondary labels |
| `ink-tertiary` | #9B9B9B | #6E6E7E | Disabled text, placeholders |
| `accent` | #005D23 | #4CAF6E | The one affirmative action, success |
| `canvas` | #F5F2EC | #1A1A2E | Page background |
| `surface` | #FFFFFF | #262640 | Cards, sheets, panels |
| `surface-sunken` | #EDEAE2 | #141428 | Inset areas, photo shelf background |
| `hairline` | #E5E5E5 | #3A3A52 | 1 pt dividers, card borders |

### Semantic

| Token | Light | Usage |
|---|---|---|
| `danger` | #C41E3A | Destructive actions, validation errors |
| `warning` | #D4A017 | Offline indicator, low stock, 2-hour flag |
| `info` | #2D4A8A | Sync activity, informational banners |

### Mode signal (privacy)

| Token | Value | Usage |
|---|---|---|
| `mode-staff` | #0A153D | Top status strip in staff mode (subtle, 2 pt) |
| `mode-client` | #005D23 | Top status strip in client-visible mode (prominent, 6 pt + label) |

Rule: client-visible mode must be identifiable from across the room. The strip plus the
slashed-eye icon are the only two signals; do not add more (screen dimming, borders, etc.).

### Verdict colours

| Verdict | Token | Light |
|---|---|---|
| loved | `verdict-loved` | #005D23 |
| liked | `verdict-liked` | #2D4A8A |
| unsure | `verdict-unsure` | #D4A017 |
| rejected | `verdict-rejected` | #9B9B9B |

Rejected is grey, not red — a rejected frame is data, not an error.

---

## 3. Typography

Two brand faces plus SF Pro for system chrome. Never more than two weights per screen region.

| Style | Font | Size/Line | Weight | Usage |
|---|---|---|---|---|
| `display-xl` | Helvetica Now Display | 34/38 | Bold | Screen titles, client name in profile |
| `display-l` | Helvetica Now Display | 28/32 | Bold | Section headers, product names in detail |
| `display-m` | Helvetica Now Display | 22/26 | Medium | Card titles, sheet titles |
| `price` | Helvetica Now Display | 22/26 | Medium, tabular figures | All prices |
| `body` | Helvetica Neue | 17/24 | Regular | Body text, list rows (Apple HIG minimum) |
| `body-strong` | Helvetica Neue | 17/24 | Medium | Emphasized body, button labels |
| `caption` | Helvetica Neue | 14/18 | Regular | Metadata, timestamps, photo captions |
| `label` | Helvetica Neue | 13/16 | Medium, +0.4 tracking, uppercase | Badges, filter pills, section eyebrows |
| `mono` | SF Mono | 15/20 | Regular | SKUs, codes, technical IDs |

Rules:

- System chrome (tab bar labels, sheet grabbers, native controls) keeps SF Pro. Do not
  override fonts inside native controls.
- Client-visible mode bumps `body` to 19/26 and requires WCAG AAA contrast (client may not
  be wearing glasses — doc 11).
- Dynamic Type: respect up to two size increments; layouts must not break at +2.

---

## 4. Layout, Spacing, Shape

### Spacing scale (4 pt base)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

| Context | Value |
|---|---|
| Screen margins (landscape) | 32 pt |
| Screen margins (portrait) | 24 pt |
| Gutter between panels | 24 pt |
| Card internal padding | 16 pt |
| Grid gap (product cards) | 16 pt |
| Between stacked cards | 12 pt |

### Session workspace grid (landscape 1366 pt)

```
| 32 | ——— left panel 762 pt ——— | 24 | ——— right panel 492 pt ——— | 32 |
```

60/40 split per doc 02. Right panel collapses in portrait and in hand-to-client.

### Radii

| Element | Radius |
|---|---|
| Cards, panels | 12 pt (brand max — doc 11) |
| Buttons, inputs, pills | 10 pt |
| Thumbnails | 8 pt |
| Sheets | 12 pt top corners |
| Photos in fitting shelf | 8 pt |

All corners use iOS continuous (superellipse) curvature, not plain rounding.

### Elevation

| Level | Use | Treatment |
|---|---|---|
| 0 | Cards on canvas | 1 pt `hairline` border, no shadow |
| 1 | Sticky bars, floating action bar | Blur material + hairline top/bottom |
| 2 | Sheets, popovers | System sheet shadow (native default) |

No custom shadows. Depth comes from blur materials and hairlines, which is what makes iOS
feel clean.

---

## 5. Iconography

SF Symbols exclusively. Fixed vocabulary — one symbol per concept, app-wide:

| Concept | Symbol | Concept | Symbol |
|---|---|---|---|
| Privacy: staff | `eye.fill` | Capture | `camera.fill` |
| Privacy: client | `eye.slash.fill` | Barcode scan | `barcode.viewfinder` |
| Sync OK | `checkmark.icloud` | Compare | `square.grid.2x2` |
| Sync pending | `arrow.triangle.2.circlepath.icloud` | Shortlist | `star` / `star.fill` |
| Sync error | `exclamationmark.icloud` | Verdict loved | `heart.fill` |
| Client | `person.crop.circle` | Verdict liked | `hand.thumbsup.fill` |
| Session | `person.2` | Verdict unsure | `questionmark.circle` |
| Appointment | `calendar` | Verdict rejected | `xmark.circle` |
| Second Sight | `arrow.triangle.2.circlepath` | Hand to client | `hand.point.up.left.fill` |
| Handoff | `person.line.dotted.person` | Hold (inventory) | `hourglass` |

No emoji anywhere in UI (brand register, doc 11). Verdict emoji in older specs
(❤️👍🤔👎) are replaced by these symbols in verdict colours.

---

## 6. Component Library

Sixteen components build every V1 screen. Each entry: anatomy, variants, states, privacy
behaviour. States marked ● are mandatory to design and build; a component without all its
● states is incomplete.

### 6.1 TabBar

Bottom bar, 5 items (Home · Clients · Products · Appointments · More), blur material,
hairline top. Active item: `ink` icon + label; inactive: `ink-tertiary`.
**States:** ● default, ● badge (More shows sync-error dot), hidden (fitting mode,
hand-to-client).
**Privacy:** unchanged in client-visible mode; hidden entirely in hand-to-client.

### 6.2 TopBar

Per-screen title bar. Left: back/close. Centre: title (`display-m`). Right: privacy toggle +
sync indicator, always in this order, always both present.
**States:** ● default, ● large-title (scrolls to compact), ● session-active (shows client
name chip: "Session · Marie D."), ● offline (warning tint on sync indicator).

### 6.3 PrivacyToggle + ModeStrip

The eye icon (44 × 44 pt target) plus the coloured strip across the very top of the screen.
Staff: 2 pt `mode-staff` strip, `eye.fill`. Client-visible: 6 pt `mode-client` strip with
centred label "CLIENT VIEW" (`label` style, white), `eye.slash.fill`.
**States:** ● staff, ● client-visible, ● transition (<100 ms crossfade, no data refetch —
doc 01 §Implementation).
**Behaviour:** toggling never navigates. Screens re-render in place. Panels that cannot
render in client mode (internal notes) grey out with a lock glyph and "Switch to staff view"
caption rather than disappearing — disappearing panels cause layout jumps.

### 6.4 SyncIndicator

Dot + optional count in TopBar. Green (`accent`) synced · yellow (`warning`) + count pending
· red (`danger`) error · amber banner state at 2-hour offline flag (doc 08).
**States:** ● synced, ● pending(n), ● error, ● offline-2h (banner variant).
Tap → SyncStatus popover: pending writes preview, force sync, last-sync timestamp.

### 6.5 Button

| Variant | Treatment | Use |
|---|---|---|
| Primary | `accent` fill, white label | The one affirmative action per screen |
| Secondary | `ink` fill, white label | Navigation-ish actions ("Open profile") |
| Tertiary | Transparent, `ink` label, hairline border | Cancel, alternatives |
| Destructive | Transparent, `danger` label | Delete photo, discard session |

44 pt min height, 10 pt radius, `body-strong` label.
**States:** ● default, ● pressed (0.96 scale + 85% opacity, 120 ms), ● disabled (40%
opacity), ● loading (label → inline spinner, width locked).

### 6.6 ProductCard

Grid card. Image (1:1, `surface-sunken` letterbox), name (`display-m` at 17 pt), colour
count caption, price (`price` at 17 pt), StockDot, FitBadge when client context active.
**States:** ● default, ● pressed, ● out-of-stock (image 60% opacity + "None here" caption),
● owned (de-emphasized: 70% opacity + "Owns" badge — doc 03), ● skeleton.
**Privacy:** price hidden in client-visible mode, replaced by "Tap for price" affordance;
StockDot hidden; sales data never on the card in either mode.

### 6.7 StockDot & FitBadge

StockDot: 8 pt dot — green in stock · amber ≤2 · red zero here · grey discontinued. Always
paired with VoiceOver text (doc 11 accessibility).
FitBadge: pill with SF Symbol + text — "Fit ✓" (`accent`) ≤2 mm · "±3 mm" (`warning`)
· "Wide" / "Narrow" (`ink-tertiary`) >4 mm. Client-visible mode: FitBadge stays (it's about
the client, safe to show); StockDot hides.

### 6.8 AppointmentCard

Time (`display-m`, tabular), client name, type + duration + location (`caption`), status
badge, held-frames count with `hourglass`, actions row (Check in · Start session ·
No-show via long-press context menu).
**States:** ● scheduled, ● confirmed, ● in-progress (accent left edge, 3 pt), ● completed
(collapsed single line), ● no-show (grey, struck time).
**Privacy:** in client-visible mode shows time + type only (doc 01 per-screen table).

### 6.9 ClientContextPanel

Right-panel card stack in session mode: identity header (name `display-l`, tier badge,
home location), fit profile, stated + derived preferences side-by-side, last 3 orders,
wishlist (expandable), live session notes.
**States:** ● full, ● collapsed (portrait — becomes top chip, tap to overlay), ● skeleton.
**Privacy:** client-visible hides tier internals, credits, derived preferences, notes;
keeps name, fit profile, stated preferences, wishlist.

### 6.10 FilterPillRow

Horizontal scroll of pills (`label` type). Selected: `ink` fill, white text. Multi-select
per doc 03 filter table. Overflow fades at edges.
**States:** ● default, ● selected, ● disabled (offline for network-dependent filters).

### 6.11 Sheet

Native detent sheet. Product detail: 70% detent, expandable to full. End-session: medium
detent, sequential steps. Grabber always visible; pull-down dismisses except mid-consent
or mid-save (then confirm dialog).
**States:** ● 70%, ● full, ● blocked-dismiss.

### 6.12 ActionBar

Sticky bottom bar inside detail views (product detail, profile). Blur material, hairline
top, max 3 visible actions + overflow menu. Primary action slot rightmost.
**Privacy:** actions re-evaluate per mode (e.g. "Start Rx order" is staff-only).

### 6.13 CaptureButton + CameraChrome

Fitting mode camera. 72 pt shutter, right-edge centred (thumb reach with two-handed
landscape grip), volume-button shutter. Face-framing guide at 30% opacity. Photo count
"14 / 20" (`mono`) top-right of feed. Barcode scan toggle bottom-left of feed.
**States:** ● ready, ● capturing (burst — ring animation, 3 ticks), ● processing
(<500 ms to thumbnail, doc 11), ● cap-reached (shutter disabled + explainer),
● no-consent (see FittingShelf and doc 14 flow E).

### 6.14 ShelfThumbnail

Fitting shelf item: photo (8 pt radius), product name or "Unlinked" badge (`warning`
tint), verdict dot (verdict colours), shortlist star.
**States:** ● linked, ● unlinked, ● uploading (progress ring on corner), ● verdict-set,
● selected-for-compare (accent border, checkmark), ● no-photo (frame swatch placeholder —
consent-declined sessions log frames without photos).
Swipe left: remove (confirm). Tap: detail popover (photo large, notes, VerdictControl,
re-link, shortlist).

### 6.15 VerdictControl

Four-segment control using verdict symbols + colours, single-select, one tap. Sets verdict
and fires the interaction write (doc 04 verdict table).
**States:** ● unset, ● each verdict, ● client-voice (verdict set during hand-to-client
renders with a small `person.crop.circle` marker — client's own verdict is distinguishable
from SA's).

### 6.16 ConsentModal

Non-dismissable-by-tap modal at first capture attempt per session. Title, plain-language
scope ("Photos save to Marie's account. We ask every visit."), bilingual toggle (EN/FR —
consent scripts ship bilingual in V1), two equal-weight buttons: "Client agrees" (primary)
and "No photos this session" (secondary — not tertiary; declining is a first-class path).
Logs `consentCapturedAt` or `consentDeclined` with timestamp.

### Shared patterns

**Skeletons:** match final layout exactly, pulse (not shimmer), max 2 s then error state
(doc 11). **Empty states:** brand line-art + one sentence + one CTA. **Toasts:** top,
blur material, 3 s, never for validation (inline only). **Destructive confirms:** native
alert for irreversible (delete photo), undo-toast for reversible (remove from shortlist).

---

## 7. Motion

| Motion | Duration | Curve | Notes |
|---|---|---|---|
| Sheet present/dismiss | system spring | system | Never customize |
| Push/pop | system | system | Never customize |
| Privacy mode crossfade | 90 ms | ease-out | Under the 100 ms budget |
| Card press | 120 ms | ease-out | Scale 0.96 |
| Shelf thumbnail insert | 250 ms | spring (0.8 damping) | Slides in from capture point |
| Verdict set | 180 ms | ease-out | Colour fill + single haptic |
| Skeleton pulse | 1.2 s loop | ease-in-out | Opacity 0.5 → 0.8 |
| Compare grid assemble | 300 ms | spring | Thumbnails fly to grid positions |

Reduce Motion: all springs become 150 ms crossfades. Nothing else moves, ever.

---

## 8. Voice in UI Copy

- Sentence case everywhere except `label`-style badges.
- Verbs on buttons ("Start session", never "Session").
- No exclamation marks, no emoji, no "Oops".
- Client-visible mode copy addresses the client ("Your shortlist"); staff mode addresses
  the SA ("Marie's shortlist").
- All client-facing strings (client-visible mode, consent scripts, summary emails) ship
  EN + FR in V1. Staff-only chrome may remain EN-only until V3.

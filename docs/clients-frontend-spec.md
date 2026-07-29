# Clients — Frontend UX/Design Spec

> Screen-by-screen design specification for the Clients flow on the Lunettiq iPad app.
> Audience: UX designers, visual designers, frontend developers.
> Based on wireframes: `lunettiq-ipad-client-wireframes.html`

---

## Overview

The Clients flow is the SA's primary tool for managing client relationships. The redesign introduces:

1. **Fixed identity rail** — client identity, stats, loyalty, and actions always visible on the left, never scrolling away.
2. **Tabs own the full content area** — Overview, Clinical, History, Relationships govern the right side.
3. **Section-level editing** — tapping "Edit" flips an entire card into a form. No field-at-a-time round-trips.
4. **Unified history timeline** — orders, try-ons, notes, and visits interleave chronologically.
5. **Sheet pattern** — heavier forms (Rx, Insurance, Lifestyle, Preferences, Multi-pair) open as sheets.
6. **Profile gaps** — missing data surfaces as actionable chips, driving the visit.
7. **Session workspace** — session bar owns state; right rail is a strict narrative (who → tools → tray).

### Flow Map

```
CLI-01 (Client List + Preview)
  ├── CLI-02 (Client Profile — rail + tabs)
  │     ├── Tab: Overview (contact, preferences, insurance, lifestyle, wishlist, tags, multi-pair)
  │     ├── Tab: Clinical (prescriptions, fit profile, sizing guidance)
  │     ├── Tab: History (unified timeline)
  │     └── Tab: Relationships (linked clients)
  │     │
  │     ├── Sheet: Add/Edit Rx
  │     ├── Sheet: Add/Manage Insurance
  │     ├── Sheet: Lifestyle Questionnaire (staff fast / client guided)
  │     ├── Sheet: Preferences Editor
  │     ├── Sheet: Multi-pair Suggestions
  │     │
  │     └── SES-01 (Session Workspace)
  │           └── FIT-01 (Fitting — photo capture sub-mode)
  │
  └── CLI-03 (New Client Sheet)
        └── CLI-04 (Duplicate Resolution)
```

### Navigation Context

- **Tab:** Clients (second tab in TabBar)
- **Stack:** `app/(app)/clients/` — file-based routing via Expo Router
- **Persistence:** Client list state persists across tab switches
- **Deep link:** `lunettiq://clients/{id}` → CLI-02

---

## Design Tokens Reference

### Colors

| Token | Usage in Clients |
|---|---|
| `bg-color-bg-page` | Screen background |
| `bg-color-bg-surface` | Cards, rail, panels |
| `bg-color-bg-surface-hover` | Hovered/selected row |
| `bg-color-bg-muted` | Secondary surfaces, empty card backgrounds |
| `bg-color-bg-inverse` | Session bar, dark chrome |
| `bg-color-brand` | Primary CTA (one per screen) |
| `text-color-text-primary` | Names, headings, values |
| `text-color-text-secondary` | Supporting text, labels |
| `text-color-text-muted` | Metadata, timestamps, empty states |
| `border-color-border` | Card borders, dividers, input borders |
| `ring-color-focus-ring` | Focus indicators, editing card outline |
| `bg-color-success` | Active status, verified badges |
| `bg-color-warning` | Unverified badges, missing data indicators |

### Typography

| Element | Token | Notes |
|---|---|---|
| Screen title (TopBar) | `text-heading-xl` (28px) | "← Willem Shepherd" |
| Rail client name | `text-heading-md` (20px) | Below avatar |
| Section heading (card h5) | `text-caption-sm` (11px mono) | Uppercase, 0.12em tracking |
| Card title (h4) | `text-body-md` (16px) 600 weight | "Contact", "Preferences" |
| Body text / values | `text-body-sm` (14px) | Key-value pairs |
| Metadata | `text-caption-md` (12px) | Timestamps, emails |
| Mono values | `font-mono text-body-sm` | Dates, prices, measurements |
| Empty state text | `text-body-sm italic` | "Not set", "None recorded" |

### Spacing

| Context | Token | Value |
|---|---|---|
| Rail internal padding | 18px | Per section |
| Content area padding | 20px | Tab content |
| Card internal padding | 14–16px | cbody |
| Between cards (stack) | 18px gap | Vertical stack |
| Grid gap (2-col) | 18px | grid2 layout |
| Pill/chip row gap | 8px | Between filter chips |

---

## Screen: CLI-01 — Client List + Preview

### Purpose

Find clients fast. The preview earns its space: identity, the three numbers a SA needs before greeting someone, what's missing from the profile, and the two actions that matter. The "profile gaps" chips answer "what should I do with this visit?" in one glance.

### Entry / Exit

| Entry | Exit |
|---|---|
| Tab bar → Clients | Row tap → CLI-02 (profile) |
| Global search (filtered to clients) | "Start session" → SES-01 |
| Home "Search client" quick action | "Open profile" → CLI-02 |
| Appointment card → client link | "+ New client" → CLI-03 (sheet) |

### Layout (Landscape — 40/60 Split)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ModeStrip (3px staff / 6px client)                                  │
├─────────────────────────────────────────────────────────────────────┤
│ TopBar: "Clients" (heading)      6,772 total · Synced ●             │
├──────────────────────────────┬──────────────────────────────────────┤
│ SearchBar                    │                                      │
│ ─────────────────────────    │  [Avatar 72px]  Willem Shepherd      │
│ Pill filters:                │  Essential · Active                  │
│ [All] [Recent] [VIP]        │  willem@sweetyams.com · No phone · EN│
│ [CULT] [VAULT] [Incomplete] │                                      │
│ ─────────────────────────    │  ┌─ Stats card ────────────────────┐ │
│                              │  │  Orders: 0 │ LTV: $0 │ Last: Apr│ │
│ ClientRow (selected) ▌       │  └─────────────────────────────────┘ │
│ ClientRow                    │                                      │
│ ClientRow                    │  ┌─ Profile gaps ──────────────────┐ │
│ ClientRow                    │  │ [No Rx] [No fit] [No lifestyle] │ │
│ ClientRow                    │  │ [No insurance]                  │ │
│ ClientRow                    │  └─────────────────────────────────┘ │
│ ClientRow                    │                                      │
│ ...                          │  [Start session]  [Open profile]     │
│                              │  [Book appointment]                  │
│ ─────────────────────────    │                                      │
│ [+ New client]               │                                      │
├──────────────────────────────┴──────────────────────────────────────┤
│ TabBar: Home | Clients● | Products | Calendar                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Components

#### TopBar
- Left: "Clients" (`text-heading-xl`)
- Right: total count (mono) + sync status indicator dot

#### SearchBar
- Full-width within left panel, `min-height: 44px`
- Placeholder: "Search by name, email, or phone"
- Debounce: 300ms
- Clear button when active

#### FilterPillRow
- Horizontal scroll, single-select
- Chips: All (default), Recent, VIP, CULT, VAULT, **Incomplete** (new — shows clients with profile gaps)
- Active state: `bg-color-bg-inverse` + `text-color-text-inverse`
- Default state: `border border-color-border`

#### ClientRow
- Height: 64px minimum
- Layout: Avatar (44px initials) | Name (14px 500) + Email (12px muted) | Relative timestamp (right-aligned, 11px muted)
- Selected: `bg-color-bg-muted` + left inset border 3px `bg-color-bg-inverse`
- No-name fallback: "No name yet" in muted with "?" avatar

#### Preview Panel (right 60%)
- **Identity block:** Avatar (72px) + Name (20px 600) + Badges (Essential/CULT/VAULT + Active) + Contact line
- **Stats card:** 3-column grid (Orders | Lifetime value | Last visit) — centered, mono values, uppercase labels
- **Profile gaps card:** Chip list of missing data ("No Rx on file", "No fit measurements", "Lifestyle not filled", "No insurance"). Drives the visit — answers "what should I collect today?"
- **Action buttons:** "Start session" (primary, flex:1) + "Open profile" (ghost, flex:1) side by side, "Book appointment" (ghost, full-width) below

### States

| State | Display |
|---|---|
| Loading | 7 skeleton rows (left) + skeleton preview (right) |
| Empty (no clients at all) | Illustration + "No clients yet" + "Add your first" CTA |
| Empty (search, no results) | "No clients match '{query}'" + "Create new client?" link |
| No selection (first load) | Preview shows: "Select a client to preview" with subtle illustration |
| Content | List with selection + preview panel |
| Offline | Cached clients, banner: "Offline — showing cached data" at top of list |

### Data Bindings

```typescript
GET /api/clients?q={search}&tag={filter}&sort=lastName&limit=50&offset={n}

// Preview (lightweight — uses list item data, no extra call)
// Full profile call only fires on CLI-02 navigation
```

### Interactions

| Gesture | Action |
|---|---|
| Tap row | Select → show preview (landscape) |
| Tap "Open profile" | Navigate to CLI-02 |
| Tap "Start session" | Start session → SES-01 |
| Tap "Book appointment" | Open booking sheet |
| Tap profile gap chip | Navigate to CLI-02 → relevant tab/card |
| Long-press row | Context menu: Start session, Open profile, Copy email |
| Swipe left on row | Quick action: "Start session" |
| Pull to refresh | Refresh list |
| Scroll bottom | Load next 50 (infinite scroll) |
| Tap "+ New client" | Open CLI-03 sheet |

### Privacy Mode

| Element | Staff | Client-visible |
|---|---|---|
| Client names | ✅ | ✅ |
| Emails | ✅ | ✅ |
| Tier badges | ✅ | ❌ Hidden |
| LTV / order count (preview) | ✅ | ❌ Hidden |
| Profile gaps | ✅ | ❌ Hidden |
| "Incomplete" filter | ✅ | ❌ Hidden |

---

## Screen: CLI-02 — Client Profile (Rail + Tabs)

### Purpose

Complete client view. The **fixed left rail** holds identity, quick stats, loyalty, Rx status, and the three actions — always visible, never scrolls away. **Tabs** govern the full right content area.

### Entry / Exit

| Entry | Exit |
|---|---|
| CLI-01 → "Open profile" / row tap | ← Back → CLI-01 |
| Appointment card → client name | "Start session" → SES-01 |
| Session workspace → "Open profile" | "Second Sight" → SSI-01 |
| Deep link: `lunettiq://clients/{id}` | "Custom design" → CDX-01 |
| Home → Recent clients | Tab switch (preserves state) |

### Layout — Fixed Rail (300px) + Content Area

```
┌─────────────────────────────────────────────────────────────────────┐
│ ModeStrip                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ TopBar: ← Willem Shepherd              Privacy: Staff ▾  ⋯         │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  RAIL        │  TAB BAR                                             │
│  (fixed,     │  [Overview●] [Clinical] [History] [Relationships]   │
│  300px,      │  ────────────────────────────────────────────────    │
│  no scroll)  │                                                      │
│              │  TAB CONTENT (scrollable)                            │
│  ┌────────┐  │                                                      │
│  │Avatar  │  │  (varies by tab — see below)                        │
│  │72px    │  │                                                      │
│  │Name    │  │                                                      │
│  │Email   │  │                                                      │
│  │Badges  │  │                                                      │
│  └────────┘  │                                                      │
│              │                                                      │
│  Quick stats │                                                      │
│  ──────────  │                                                      │
│  Orders: 0   │                                                      │
│  LTV: $0.00  │                                                      │
│  AOV: —      │                                                      │
│  Member since│                                                      │
│  Last visit  │                                                      │
│              │                                                      │
│  Loyalty     │                                                      │
│  ──────────  │                                                      │
│  Credits: $0 │                                                      │
│  Next tier   │                                                      │
│              │                                                      │
│  Rx status   │                                                      │
│  ──────────  │                                                      │
│  None on file│                                                      │
│              │                                                      │
│  ═══════════ │                                                      │
│  [Start      │                                                      │
│   session]●  │                                                      │
│  [Second     │                                                      │
│   Sight]     │                                                      │
│  [Custom     │                                                      │
│   design]    │                                                      │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│ TabBar                                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Rail Anatomy (fixed, never scrolls)

| Section | Content |
|---|---|
| **Identity** | Avatar (72px) + Name (heading-md) + Email (caption) + Badges (tier + active status) |
| **Quick stats** | Key-value pairs: Orders, Lifetime value, AOV, Member since, Last visit. Mono values. |
| **Loyalty** | Credits balance + "Next tier: CULT · $850 away" |
| **Rx status** | "None on file · Add in Clinical" or "Verified · expires YYYY-MM-DD" |
| **Actions** (pinned bottom) | "Start session" (primary), "Second Sight" (ghost), "Custom design" (ghost). Full-width, stacked. |

### Tab Bar

- 4 tabs: **Overview** | **Clinical** | **History** | **Relationships**
- Active tab: `text-color-text-primary` 600 weight + bottom 2px underline `bg-color-bg-inverse`
- Inactive: `text-color-text-muted`
- Tabs separated by faint right border

---

### Tab: Overview

Two-column grid (`grid-template-columns: 1fr 1fr`, gap 18px). Each section is a **card** with header (title + action link) and body.

#### Left Column

1. **Contact card**
   - Fields: First name, Last name, Email, Phone, Language, Home location
   - Key-value rows: label (muted) | value (right-aligned)
   - Empty values: italic muted "Not set"
   - Action: "Edit" → flips to section-level edit mode (see below)

2. **Preferences card**
   - Fields: Shapes, Materials, Colours, Avoid
   - Values as chips or "None recorded" italic
   - Action: "Edit" → opens Preferences Sheet

3. **Wishlist card**
   - Header: "Wishlist" + count badge + "See all" link
   - Body: 3-column thumbnail grid (product images)
   - Empty: "No wishlist items"

4. **Tags & segments card**
   - Chip list of tags + "Add tag" chip
   - Segment memberships listed below
   - Empty: "Not in any segments"

#### Right Column

1. **Insurance card**
   - Shows provider, coverage remaining, pairs remaining
   - Empty: "No insurance profile on file. Add it to unlock coverage-aware multi-pair suggestions."
   - Action: "Add" → opens Insurance Sheet

2. **Lifestyle card**
   - Shows summary of completed questionnaire or empty state
   - Empty: "Questionnaire not filled. Unlocks better recommendations."
   - Action: "Fill — 2 min" → opens Lifestyle Sheet

3. **Multi-pair suggestions card**
   - Shows input readiness: "Uses lifestyle, Rx, and insurance. **2 of 3 inputs missing** — suggestions will be generic."
   - Action: "Generate suggestions" button → opens Multi-pair Sheet
   - When inputs complete: shows suggestions inline or link to sheet

4. **Upcoming card**
   - Next appointment (if any)
   - Empty: "No appointment scheduled."
   - Action: "Book"

5. **Internal notes card**
   - Staff-only freeform notes
   - Empty: "No notes yet."
   - Action: "Add"

---

### Section-Level Edit Pattern

**The key design decision:** tapping "Edit" on a card flips the **entire card** into a form. All fields editable simultaneously. Save/Cancel at the card footer. Other cards remain in view mode.

```
┌─────────────────────────────────────────────────────────┐
│  Contact — editing                          (card.editing)│
├─────────────────────────────────────────────────────────┤
│  [First name: Willem]  [Last name: Shepherd]            │
│  [Email: willem@sweetyams.com]                          │
│  [Phone: +1___]  [Language: EN● | FR ]                  │
│  [Home location: ●Plateau | DIX30 | Online]            │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save contact]●  │
└─────────────────────────────────────────────────────────┘
```

**Visual treatment:**
- `card.editing`: 2px outline `ring-color-focus-ring`, header background `bg-color-bg-muted`
- Other cards stay in normal view mode (not greyed, not disabled)
- Footer: `border-top`, muted background, right-aligned Cancel (ghost) + Save (primary)
- Only one card can be in edit mode at a time

**Which cards use section-level edit vs. sheet:**

| Section | Edit pattern | Why |
|---|---|---|
| Contact | Section-level (inline card) | Simple fields, quick edits |
| Fit profile (Clinical) | Section-level (inline card) | Measurement values, one set |
| Preferences | **Sheet** | Complex chip picker, needs more space |
| Insurance | **Sheet** | Multi-field form + live coverage calc |
| Lifestyle | **Sheet** | 7-question questionnaire |
| Prescriptions | **Sheet** | Clinical data entry, OD/OS table |
| Multi-pair | **Sheet** | AI output, product cards, actions |

---

### Tab: Clinical

Two-column grid. **Staff-only** — this tab disappears in client-visible mode.

#### Left Column

1. **Prescriptions card**
   - Header: "Prescriptions" + "+ Add Rx" action
   - Body: Expandable list of Rx records
   - Each record: Type + prescriber | Verified/Unverified badge | Date + expiry (mono) | Expanded: OD/OS table (SPH, CYL, AXIS, ADD, PD) in mono
   - Unverified records show reminder: licensed optician must verify (OOAQ)

2. **Clinical notes card**
   - Header: "Clinical notes · staff only" + "Add" action
   - Body: Freeform text entries with timestamps

#### Right Column

1. **Fit profile card**
   - Header: "Fit profile" + "Edit" action (section-level edit)
   - Fields (key-value mono): Face shape, Frame width (mm), Bridge width (mm), Temple length, IPD (mm), Source + date
   - Footer action: "Capture with LiDAR" button (full-width)
   - Empty fields: "Not measured" italic muted

2. **Sizing guidance card**
   - Auto-computed from fit profile
   - "Best fit range: `47–50 □ 19–21`" — updates when measurements change
   - Read-only, no edit action

---

### Tab: History (Unified Timeline)

**One merged timeline** instead of separate sections. Orders, try-on sessions, product interactions, notes, and visits interleave chronologically.

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Filter pills: [All●] [Orders] [Try-ons] [Notes] [Visits]       │
│                                     [Rx pipeline orders →] [+ Add note] │
├─────────────────────────────────────────────────────────────────┤
│ Jul 28    Try-on session · 6 frames                             │
│ 4:12 PM   Loved DREWE Tortoise, unsure on BOND Blue            │
│           4 photos · with Benjamin                              │
├─────────────────────────────────────────────────────────────────┤
│ Jul 12    Order #1187 · $310.00                                 │
│ 2:03 PM   DREWE Smoke + single-vision lenses                   │
│           Rx pipeline: Ready for pickup                         │
├─────────────────────────────────────────────────────────────────┤
│ Jul 12    Note · consultation                                   │
│ 1:40 PM   "Wants a bolder second pair for evenings..."          │
│           — Alex M.                                             │
├─────────────────────────────────────────────────────────────────┤
│ Jun 02    Store visit · Plateau                                 │
│           Browsed, no purchase                                  │
└─────────────────────────────────────────────────────────────────┘
```

- **Each entry:** Timestamp (mono, 11px, fixed 74px width) | Title (bold 13px) + Body (12.5px muted) + Attribution
- **Filter pills:** single-select type filter (All default)
- **Actions:** "Rx pipeline orders →" links to Rx pipeline admin, "+ Add note" opens note creation
- **Pagination:** infinite scroll, loads 50 at a time
- **Empty state:** "No history yet — start a session to begin tracking."

---

### Tab: Relationships

- List of linked clients with relationship badge
- Each row: Avatar | Name | Relationship type (spouse, parent, child, friend, etc.)
- Tap → navigate to that client's CLI-02
- Empty: "No linked clients" + "Link a client" action
- Action: "+ Link client" → search/select sheet

---

### States (all tabs)

| State | Display |
|---|---|
| Loading | Rail skeleton + tab content skeleton |
| Error | Error message + retry in content area (rail preserved if cached) |
| Not found | "Client not found" empty state + back button |
| Offline | Cached data with "Last synced {time}" indicator under rail |

### Data Bindings

```typescript
// Single composite call (populates rail + initial tab)
GET /api/clients/{id}

// Tab-specific (lazy loaded on tab activation)
GET /api/clients/{id}/interactions?limit=50       // History
GET /api/clients/{id}/enrichment                  // Clinical
GET /api/clients/{id}/prescriptions               // Clinical
GET /api/clients/{id}/links                       // Relationships
GET /api/clients/{id}/wishlist                    // Overview
GET /api/clients/{id}/segments                    // Overview

// Multi-pair inputs
GET /api/admin/multi-pair/insurance?customerId={id}
GET /api/admin/multi-pair/questionnaires?customerId={id}
```

### Privacy Mode

| Element | Staff | Client-visible |
|---|---|---|
| Name, avatar | ✅ | ✅ |
| Contact info | ✅ | ✅ |
| Tier badge | ✅ | ❌ Hidden |
| Quick stats (LTV, AOV, orders) | ✅ | ❌ Hidden |
| Credit balance | ✅ ($420) | "Credits available" (no amount) |
| Preferences | ✅ | ✅ |
| Wishlist | ✅ (with prices) | ✅ (no prices) |
| Insurance | ✅ | ❌ Hidden |
| Lifestyle answers | ✅ | ✅ (read-only) |
| Tags & segments | ✅ | ❌ Hidden |
| Internal notes | ✅ | ❌ Hidden |
| Clinical tab | ✅ | ❌ Tab hidden entirely |
| History tab | ✅ | ❌ Tab hidden entirely |
| Relationships tab | ✅ | ❌ Tab hidden entirely |
| Multi-pair | ✅ | ❌ Hidden |
| Rail actions | ✅ All 3 | ✅ "Start session" only |

---

## Sheet: Add Prescription

### Purpose

Enter Rx data matching the paper form opticians read from. The table mirrors the clinical document — OD/OS rows, mono values, one keyboard pass. Photo capture is first-class: snap the paper Rx, values stay unverified until a licensed optician signs off.

### Trigger

- Clinical tab → "+ Add Rx" action
- Rail → "Add in Clinical" link

### Presentation

- Centered sheet (640px wide), dimmed backdrop
- Title + client name in header
- Scrollable body, sticky Cancel/Save footer
- Non-dismissable by backdrop tap (has unsaved data)

### Layout

```
┌─── Sheet ───────────────────────────────────────────────┐
│ Add prescription                   Willem Shepherd       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Source: [Enter manually●] [Photograph paper Rx] [Import]│
│                                                         │
│ [Type: Distance ▾]     [Prescriber: Dr. name]           │
│ [Exam date: YYYY-MM-DD]  [Expiry: Auto +24 months]     │
│                                                         │
│ Values:                                                 │
│ ┌──────┬────────┬────────┬──────┬──────┐               │
│ │      │  SPH   │  CYL   │ AXIS │ ADD  │               │
│ ├──────┼────────┼────────┼──────┼──────┤               │
│ │  OD  │ −2.25  │ −0.50  │ 180  │  —   │               │
│ ├──────┼────────┼────────┼──────┼──────┤               │
│ │  OS  │ −2.00  │ −0.75  │ 175  │  —   │               │
│ └──────┴────────┴────────┴──────┴──────┘               │
│                                                         │
│ [PD binocular: 63.5] [PD OD/OS: __] [Seg height: __]   │
│                                                         │
│ Photo of paper Rx:                                      │
│ ┌─── dashed placeholder ────────────────────────────┐   │
│ │ Attach photo — required for optician verification │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ ⓘ Saved as Unverified. Licensed optician must verify   │
│   before this Rx enters the pipeline (OOAQ).           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                           [Cancel]  [Save prescription]●│
└─────────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Source | 3-option segmented | ✅ | Manual, Photo, Import from order |
| Type | Dropdown | ✅ | Distance, Reading, Progressive, Bifocal |
| Prescriber | Text | ❌ | Dr. name |
| Exam date | Date | ❌ | YYYY-MM-DD format |
| Expiry | Date | ❌ | Auto-calculates +24 months from exam date |
| SPH (OD/OS) | Number (mono) | ✅ | Diopter value, ±0.25 steps |
| CYL (OD/OS) | Number (mono) | ❌ | Cylinder |
| AXIS (OD/OS) | Number (mono) | Conditional | Required if CYL set |
| ADD (OD/OS) | Number (mono) | ❌ | For progressive/bifocal |
| PD binocular | Number (mono) | ❌ | mm |
| PD monocular | Number pair | ❌ | OD / OS split |
| Seg height | Number (mono) | ❌ | For progressive/bifocal |
| Photo | Image capture | ❌ | Strongly recommended for verification |

### Verification Status

- On save: status = **Unverified** (amber badge)
- Licensed optician reviews via Foundry admin → marks **Verified** (green badge)
- Only verified Rx can enter the Rx pipeline for lens ordering

---

## Sheet: Add / Manage Insurance

### Purpose

Record insurance coverage so the SA can calculate remaining allowance mid-conversation. The coverage summary computes live at the bottom as fields fill.

### Trigger

- Overview tab → Insurance card "Add" action
- Multi-pair suggestions → "Insurance — missing · Add" chip

### Layout

```
┌─── Sheet ───────────────────────────────────────────────┐
│ Add insurance                      Willem Shepherd       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Provider *: e.g. Blue Cross, Sun Life]                 │
│ [Policy number: Optional]  [Coverage amount: $ per period]│
│ [Pairs allowed: 2] [Pairs used: 0] [Renewal: YYYY-MM-DD]│
│ [Notes: Coordination of benefits, spouse plan, etc.]    │
│                                                         │
│ ┌─── Coverage summary (live-computed) ──────────────┐   │
│ │  Pairs remaining         2                        │   │
│ │  Coverage remaining      $500.00                  │   │
│ │  Renews                  2027-01-01 · 156 days    │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                             [Cancel]  [Save insurance]● │
└─────────────────────────────────────────────────────────┘
```

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Provider | Text | ✅ | Blue Cross, Sun Life, Canada Life, etc. |
| Policy number | Text (mono) | ❌ | For record keeping |
| Coverage amount | Currency (mono) | ❌ | $ per coverage period |
| Pairs allowed | Number | ❌ | Default: 2 |
| Pairs used | Number | ❌ | Default: 0 |
| Renewal date | Date (mono) | ❌ | Auto-calculates days remaining |
| Notes | Textarea | ❌ | Coordination details |

### Live Coverage Summary

- Computes as fields are filled (no save required to see values)
- `bg-color-bg-muted` background card with `border-color-border-strong`
- SA can read allowance aloud during conversation
- In manage mode: same sheet pre-filled, with "Mark pair used" action

---

## Sheet: Lifestyle Questionnaire

### Purpose

Capture the client's lifestyle to drive lens/frame recommendations. **Two modes, one data model:**

- **Staff fast mode** (shown by default): All 7 questions on one scroll. The SA already knows answers from conversation — fills in 90 seconds.
- **Client guided mode:** One-question-per-step flow for when the iPad is handed to the client.

Toggle at sheet header switches between modes. This kills the 7-step tap tax without losing the guided client experience.

### Trigger

- Overview tab → Lifestyle card "Fill — 2 min" action
- Multi-pair suggestions → "Lifestyle — missing" chip

### Layout (Staff Fast Mode)

```
┌─── Sheet ───────────────────────────────────────────────┐
│ Lifestyle              [Staff — one page●] [Hand to client] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ What do they primarily use their glasses for?           │
│ Select all that apply                                   │
│ [Office/computer●] [Driving] [Reading●] [Sports]       │
│ [All-day wear●] [Social/evening]                       │
│ ────────────────────────────────────────────────────    │
│ Daily screen time?                                      │
│ [Under 2h] [2–5h] [5–8h●] [8h+]                       │
│ ────────────────────────────────────────────────────    │
│ Time outdoors?                                          │
│ [Rarely] [Weekends●] [Daily] [Works outdoors]          │
│ ────────────────────────────────────────────────────    │
│ How often do they drive?                                │
│ [Daily commute] [Few times/week●] [Weekends] [Rarely]  │
│ ────────────────────────────────────────────────────    │
│ Light sensitivity?                                      │
│ [Very sensitive] [Somewhat●] [Not particularly] [Sun]  │
│ ────────────────────────────────────────────────────    │
│ Frame styles for a second pair?                         │
│ [Bold] [Classic●] [Sporty●] [Lightweight] [Trendy]     │
│ ────────────────────────────────────────────────────    │
│ Budget range for an additional pair?                    │
│ [Under $200] [$200–$400●] [$400–$600] [$600+]         │
│ [Insurance covers it]                                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 7 of 7 answered         [Cancel]  [Save lifestyle]●    │
└─────────────────────────────────────────────────────────┘
```

### Questions

| # | Question | Selection | Options |
|---|---|---|---|
| 1 | Primary use | Multi-select | Office/computer, Driving, Reading, Sports/outdoor, All-day wear, Social/evening |
| 2 | Screen time | Single-select | Under 2h, 2–5h, 5–8h, 8h+ |
| 3 | Time outdoors | Single-select | Rarely, Weekends, Daily, Works outdoors |
| 4 | Driving frequency | Single-select | Daily commute, Few times/week, Weekends only, Rarely |
| 5 | Light sensitivity | Single-select | Very sensitive, Somewhat, Not particularly, Only bright sun |
| 6 | Second pair styles | Multi-select | Bold/statement, Classic/timeless, Sporty/technical, Lightweight/minimal, Trendy |
| 7 | Budget range | Single-select | Under $200, $200–$400, $400–$600, $600+, Insurance covers it |

### Mode Toggle Behaviour

- **Staff mode:** All questions visible, chip selection, single scroll, footer shows "N of 7 answered"
- **Client mode:** One question per screen, larger text (20px body), progress indicator, "Next"/"Back" navigation, handed-iPad-friendly touch targets
- Toggle at top of sheet: `[Staff — one page●] [Hand to client — guided]`
- Switching mode preserves already-selected answers

---

## Sheet: Preferences Editor

### Purpose

Replace the grey "+Add" buttons that opened five separate pickers. Every attribute group is a chip field on one sheet. Tap chips from curated vocabulary, or type to add custom. "Avoid" is visually inverted — it drives exclusions in AI Stylist and multi-pair.

### Trigger

- Overview tab → Preferences card "Edit" action

### Layout

```
┌─── Sheet ───────────────────────────────────────────────┐
│ Preferences                        Willem Shepherd       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Shapes                                                  │
│ [Rectangular●] [Square●] [Round] [Cat-eye]             │
│ [Aviator] [Geometric] [+ Other]                        │
│ ────────────────────────────────────────────────────    │
│ Materials                                               │
│ [Acetate●] [Titanium] [Steel] [Combination] [+ Other] │
│ ────────────────────────────────────────────────────    │
│ Colours                                                 │
│ [Tortoise●] [Black●] [Crystal] [Bold colour]          │
│ [Metallic] [+ Other]                                   │
│ ────────────────────────────────────────────────────    │
│ Brands admired                                          │
│ [CHIMI] [Kaleos●] [Jimmy Fairly] [Lexxola] [+ Other]  │
│ ────────────────────────────────────────────────────    │
│ Avoid — excluded from all suggestions                   │
│ [̶R̶o̶u̶n̶d̶●] [̶R̶i̶m̶l̶e̶s̶s̶●] [+ Add]                            │
│ ────────────────────────────────────────────────────    │
│ Notes                                                   │
│ [Anything the chips can't capture...]                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                          [Cancel]  [Save preferences]●  │
└─────────────────────────────────────────────────────────┘
```

### Design Details

- **Chip states:** Default (border only), Selected (filled `bg-color-bg-inverse` + `text-color-text-inverse`), Avoid (filled inverse + strikethrough text)
- **"+ Other" chip:** Opens inline text input to add custom value
- **Avoid section:** Visually distinct — chips are inverse-colored with strikethrough. These drive negative filters in AI Stylist and product suggestions.
- **Brands:** Curated list from catalogue + "+ Other" for custom entry

---

## Sheet: Multi-pair Suggestions

### Purpose

Output, not just a button. Each recommendation states its reasoning (lifestyle input → lens/frame logic) and its insurance math. Actions per card: add to wishlist, add to session tray.

### Trigger

- Overview tab → Multi-pair suggestions card "Generate suggestions" button
- Session workspace → "Multi-pair suggestions →" button

### Layout

```
┌─── Sheet (720px wide) ──────────────────────────────────┐
│ Multi-pair suggestions             Willem Shepherd       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Inputs: [Lifestyle ✓●] [Rx ✓●] [Insurance — missing · Add] │
│                                                         │
│ ┌─── Pair 2 — Office / screen ──────── $250 + lenses ┐ │
│ │ [Product image]  5–8h daily screen → blue-light     │ │
│ │                  single vision. Lightweight acetate  │ │
│ │                  matches "all-day wear."            │ │
│ │                  [Add to wishlist] [Add to session]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─── Pair 3 — Driving / sun ────── $250 + Rx sun ────┐ │
│ │ [Product image]  Drives few times/week + light      │ │
│ │                  sensitive → polarized Rx sun.      │ │
│ │                  Sporty/technical matches style.    │ │
│ │                  [Add to wishlist] [Add to session]  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ⓘ Add insurance to show out-of-pocket math per pair.   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Close]                              [Regenerate]●      │
└─────────────────────────────────────────────────────────┘
```

### Key Details

- **Input readiness chips** at top: green checkmark for available, action link for missing
- **Each recommendation card:** Product thumbnail (120×74px) + reasoning text (why this pair, why these lenses) + price (mono) + actions
- **Actions per recommendation:** "Add to wishlist" (button) + "Add to session" (ghost button, only visible during active session)
- **Insurance math:** When insurance is on file, shows out-of-pocket calculation per pair
- **Regenerate:** Re-runs AI with current inputs, produces new suggestions
- **Missing inputs:** Clear messaging about what's needed to improve suggestions

---

## Screen: SES-01 — Session Workspace

### Purpose

The session bar owns state: timer, recording dot, privacy toggle, and session-scoped actions. "Capture fitting photos" is a sub-mode, not a rival CTA. The right rail is a strict top-to-bottom narrative: who the client is → tools that suggest → the tray of what happened.

### Entry / Exit

| Entry | Exit |
|---|---|
| CLI-01 preview → "Start session" | "End session" → SES-02/03/04 flow → HOME-01 |
| CLI-02 rail → "Start session" | Tab switch (session persists via session bar) |
| Appointment → "Start session" | Fitting sub-mode (FIT-01) |

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ModeStrip                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ SESSION BAR (dark inverse background)                               │
│ ● Session · Willem Shepherd · 12:03      [Hand to client]           │
│                                     [Capture fitting photos] [End]● │
├──────────────────────────────────────────┬──────────────────────────┤
│                                          │                          │
│ PRODUCT BROWSER (left, flex)             │ SESSION RAIL (340px)     │
│                                          │                          │
│ [Search 141 frames]  [Filter]            │ CLIENT                   │
│ [Best match●] [Newest] [Price↑] [↓]     │ Avatar · Name · Tier     │
│ [Fits: 47-50□19-21]                      │ Fit: 47-50□19-21        │
│                                          │ Prefers: Rect·Tort·Acet  │
│ ┌──────┐ ┌──────┐ ┌──────┐              │ Avoid: Round, rimless    │
│ │ANDY  │ │CRUISE│ │BOWIE │              │ Budget: $200-400         │
│ │Grey  │ │Grey  │ │Clear │              │ [Open profile]            │
│ │$250 +│ │$250 +│ │$250 +│              │ ─────────────────────    │
│ └──────┘ └──────┘ └──────┘              │ AI STYLIST               │
│ ┌──────┐ ┌──────┐ ┌──────┐              │ [What's the client...]   │
│ │BOND  │ │DRAPER│ │BROME │              │ [Suggest frames]         │
│ │Blue  │ │Grey  │ │Tort  │              │ [Multi-pair →]           │
│ │$250 +│ │$250 +│ │$250 +│              │ ─────────────────────    │
│ └──────┘ └──────┘ └──────┘              │ SESSION TRAY · 3 frames  │
│ ┌──────┐ ┌──────┐ ┌──────┐              │ [Photos (4)]             │
│ │DREWE │ │HILTON│ │DREWE │              │ ▪ DREWE Tort    [Loved]  │
│ │Smoke │ │Red   │ │Tort  │              │ ▪ BOND Blue    [Unsure]  │
│ │$250 +│ │$250 +│ │$250 +│              │ ▪ ANDY Grey    [No]      │
│ └──────┘ └──────┘ └──────┘              │ ─────────────────────    │
│                                          │ SESSION NOTES            │
│                                          │ [Notes save to History]  │
│                                          │ ═════════════════════    │
│                                          │ [Create order from tray]●│
├──────────────────────────────────────────┴──────────────────────────┤
│ (No TabBar — hidden during session)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Session Bar

- **Background:** `bg-color-bg-inverse` (dark)
- **Content:** Recording dot (red pulse) + "Session · {client} · {timer}" pill + action buttons
- **Actions:** "Hand to client" (border ghost), "Capture fitting photos" (border), "End session" (inverse/primary white fill)
- **Persistent:** Stays visible across tab switches until session ends

### Product Browser (Left)

- Search bar + Filter button
- Sort pills: Best match (default, uses client preferences + fit), Newest, Price ↑/↓
- **Fit filter chip:** Shows computed sizing range from fit profile (e.g. "Fits 47–50□19–21")
- 3-column product grid with "+" add button on each card
- Product cards: Image (110px) + Name (12.5px bold) + Price (mono muted)
- "+" → adds to session tray with "tried" status

### Session Rail (Right, 340px)

Top-to-bottom narrative:

1. **Client section** — Compact: Avatar + Name + Tier + Fit range + Preferences + Avoid + Budget. "Open profile" link.
2. **AI Stylist section** — Optional prompt input + "Suggest frames" button + "Multi-pair suggestions →" link
3. **Session tray** — All frames tried this session. Each: thumbnail (38×26px) + name + verdict badge. "Photos (N)" link to fitting gallery.
4. **Session notes** — Textarea, placeholder: "Notes save to History when the session ends"
5. **Footer action** (pinned bottom, dark border-top) — "Create order from tray" primary button

### Session Tray Verdicts

| Verdict | Display | Token |
|---|---|---|
| Loved | "Loved" badge, border strong | `bg-verdict-loved` |
| Liked | "Liked" badge | `bg-verdict-liked` |
| Unsure | "Unsure" badge | `bg-verdict-unsure` |
| Rejected | "No" badge | `bg-verdict-rejected` |
| Untried | No badge, muted row | — |

---

## Screen: CLI-03 — New Client (Sheet)

### Purpose

Quick client creation during walk-ins. Minimal required fields, real-time duplicate detection. Same sheet pattern as all other forms.

### Trigger

- CLI-01 → "+ New client" button
- Home → "New client" quick action

### Layout

Standard sheet (640px): Title + client fields + optional expandable section + duplicate alert banner (conditional) + sticky footer.

### Fields

| Field | Type | Required |
|---|---|---|
| First name | Text | ✅ |
| Last name | Text | ✅ |
| Email | Email | ❌ |
| Phone | Phone | ❌ |
| Language | Segmented (EN/FR) | ❌ (default: EN) |
| Address | Multi-field (expandable) | ❌ |
| Tags | Chip picker | ❌ |
| Notes | Textarea | ❌ |

### Duplicate Detection

- Fires on blur of firstName + lastName, and on blur of email/phone
- Shows amber banner if match found (confidence ≥ 60%)
- Banner actions: "View" → CLI-04, "Dismiss" → hide
- **Blocks on network** — cannot create clients offline (requires duplicate check)

### Footer

- Cancel (ghost) + "Create client" (primary)
- On success: dismiss sheet → navigate to CLI-02

---

## Screen: CLI-04 — Duplicate Resolution (Inline)

Expands inline within CLI-03 sheet when "View" is tapped on a duplicate alert.

### Layout

Side-by-side comparison: "Your entry" (left) vs "Existing client" (right). Matching fields highlighted. Confidence badge + match reason below.

### Actions

- "Use existing client" (primary) → navigate to existing CLI-02
- "Create as new client anyway" (ghost) → override, submit form
- "← Back" → return to CLI-03 form (data preserved)

---

## Shared Patterns

### Card Component

Every data card follows this anatomy:

```
┌─────────────────────────────────────────────┐
│ chead: Title (h4 600)          Action link  │  ← border-bottom
├─────────────────────────────────────────────┤
│ cbody: Key-value rows, chips, content       │
└─────────────────────────────────────────────┘
```

- Border: `border border-color-border`
- Background: `bg-color-bg-surface`
- Editing state: `ring-2 ring-color-focus-ring`, header gets `bg-color-bg-muted`
- Action link: underline, 12px, `text-color-text-primary`

### Sheet Component

All sheets inherit the same skeleton:

- Dimmed backdrop (`bg-color-overlay`)
- Centered container (640px default, 720px for multi-pair)
- Header: title (16px 600) + subtitle (12px muted, client name)
- Body: scrollable, padded 20–22px
- Footer: sticky bottom, border-top, Cancel + Primary action right-aligned
- Close: Cancel button or drag down (if no unsaved changes)

### Key-Value Row

```
Label (muted, left-aligned) ............. Value (right-aligned, or "Not set" italic)
```

- Separated by `border-bottom: 1px solid rgba(10,10,10,0.1)`
- Padding: 8px vertical
- Label: `text-color-text-muted`, 13px
- Value: `text-color-text-primary`, 13px, right-aligned. Mono for numbers/dates.
- Empty: italic `text-color-text-muted` "Not set" / "None recorded"

### Chip Component

| State | Style |
|---|---|
| Default | `border border-color-border`, 12px, padding 6px 12px |
| Selected (on) | `bg-color-bg-inverse` + `text-color-text-inverse` |
| Avoid (negative) | `bg-color-bg-inverse` + `text-color-text-inverse` + strikethrough |
| "+ Add" / "+ Other" | Default style, acts as action trigger |

---

## Transitions & Motion

| Transition | Type | Duration |
|---|---|---|
| CLI-01 → CLI-02 | Stack push | System |
| CLI-02 → CLI-01 | Stack pop / swipe back | System |
| Sheet appear | Spring from bottom center | System spring |
| Sheet dismiss | Fall + fade | System spring |
| Tab switch | Crossfade content area | 150ms ease-out |
| Card → edit mode | Crossfade fields | 90ms |
| Card → view mode (save) | Crossfade + brief green flash | 120ms |
| Session bar appear | Slide down | 200ms ease-out |
| List row selection | Background fade | 120ms |
| Skeleton shimmer | Pulse loop | 1.2s |

**Reduce Motion:** All springs become instant. Crossfades stay.

---

## Offline Behaviour

| Screen | Offline |
|---|---|
| CLI-01 | Cached clients (last 30). Banner: "Offline — cached data". Local search only. |
| CLI-02 | Cached profile. Edits queue. Banner: "Changes will sync when online". |
| CLI-02 sheets | Edits queue for sync (except Rx verification which needs server). |
| CLI-03 | **Blocked.** "Requires internet for duplicate check." |
| SES-01 | Fully functional. Product browser from local catalogue. |

---

## Client-Visible Mode — Global Rules

When privacy toggle is set to client-visible:

1. **ModeStrip:** 6px `bg-mode-client` green strip + "CLIENT VIEW" label
2. **Typography bump:** Body text → `text-body-xl` (20px)
3. **Contrast:** Target AAA (7:1) — client may not have glasses
4. **Tabs hidden:** Clinical, History, Relationships tabs removed
5. **Rail simplified:** Only name, avatar, preferences shown. Stats/loyalty/Rx hidden.
6. **Voice change:** "Marie's wishlist" → "Your wishlist"
7. **Price hiding:** Dollar amounts hidden on wishlist, tap to reveal
8. **Actions reduced:** Only "Start session" shown in rail

---

## Accessibility

- **Touch targets:** 44pt minimum on all interactive elements (chips, buttons, rows)
- **Body text:** 17pt minimum (20pt in client-visible mode)
- **VoiceOver:** All cards announce title + summary. Tab bar uses `accessibilityRole="tablist"`.
- **Focus order:** Rail → Tab bar → Tab content (top-to-bottom, left-to-right)
- **Dynamic type:** All text scales with system font size
- **Color contrast:** 4.5:1 minimum (7:1 in client mode)
- **Reduce motion:** Animations collapse to instant swaps

---

## Implementation Checklist

- [ ] Fixed rail (300px) never scrolls — actions always visible
- [ ] Tabs own full content area — no two-column confusion
- [ ] Section-level edit: whole card flips to form, save/cancel at card footer
- [ ] Only one card in edit mode at a time
- [ ] Heavier forms (Rx, Insurance, Lifestyle, Preferences, Multi-pair) use sheet pattern
- [ ] Unified history timeline with type filters (not separate sections)
- [ ] Profile gaps surface as chips on CLI-01 preview
- [ ] Multi-pair shows input readiness (which data is missing)
- [ ] Lifestyle has two modes (staff fast / client guided) with toggle
- [ ] Preferences "Avoid" chips are visually inverted (strikethrough)
- [ ] Session workspace: session bar dark inverse, product browser left, rail right
- [ ] Session tray is the session's output — ends by writing to History
- [ ] Privacy mode hides Clinical/History/Relationships tabs entirely
- [ ] All 4 states per screen: loading, error, empty, content
- [ ] 44pt touch targets, 17pt min text
- [ ] Offline graceful degradation (never blocks core reads)

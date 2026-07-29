# Cross-Screen Design System Migration

**Goal:** Apply the wireframe's visual patterns and Phase 1 components consistently across all remaining screens (Home, Appointments, Products, More/Settings).

## Current State Assessment

| Screen | Lines | Key Issues |
|--------|-------|------------|
| `home/index.tsx` | 219 | Uses old token names (`text-displayLg`, `text-body`, `text-headline`), no Phase 1 components, inconsistent spacing |
| `appointments/index.tsx` | 370 | Uses old tokens, custom pills (not Chip), split-view already works, imports feature components |
| `appointments/week.tsx` | 360 | Calendar grid, same token issues |
| `products/index.tsx` | 300 | Already updated by session work (uses `ProductCard`, `SearchBar`), but sort pills are inline Pressables not Chips |
| `products/[id].tsx` | 500 | Product detail sheet, uses old tokens (`text-bodyStrong`, `text-caption`), custom VariantChip |
| `products/scanner.tsx` | 90 | Camera screen, minimal styling |
| `more/index.tsx` | 150 | Menu list, uses old tokens (`text-body`, `text-caption`) |
| `more/settings.tsx` | 390 | Complex settings, already has `variant="dark"` fix |
| `more/rx-pipeline.tsx` | 165 | Rx order list, old tokens |
| `more/rx-approvals.tsx` | 200 | Approval queue, old tokens |

## Token Migration Required

These old token names exist across the codebase and need replacement:

| Old Token | New Token | Occurrences |
|-----------|-----------|-------------|
| `text-displayLg` | `text-display-lg` | ~3 |
| `text-headline` | `text-heading-xl` | ~4 |
| `text-body` | `text-body-md` | ~30 |
| `text-bodyStrong` | `text-body-md font-medium` | ~8 |
| `text-caption` | `text-caption-md` | ~15 |
| `text-white` | `text-text-inverse` | ~5 |
| `bg-bg-elevated` | `bg-bg-surface` | ~10 (elevated = surface in this design) |
| `text-xs` | `text-caption-md` or `text-body-xs` | ~3 |
| `bg-color-skeleton-bg` | `bg-skeleton-bg` | ~3 |
| `px-xl pt-2xl pb-lg` | `px-lg py-md` (topbar pattern) | ~3 |

## Screens to Update

### Priority 1 — HOME-01 (Today View)

**What exists:** Working split layout (3:2 ratio), AppointmentCard list, sidebar with ActiveHoldsCard, RecentClientsCard, QuickActionsGrid. All functional.

**What needs updating:**
1. TopBar → match wireframe pattern: `flex-row items-center justify-between px-lg py-md border-b border-border`
2. Title → `text-heading-lg` (not `text-displayLg`)
3. Subtitle → `text-body-sm text-text-muted` with sync status dot
4. Left panel → width should be fixed (~762px per wireframe spec) not flex-3
5. AppointmentCard → already exists, may need token refresh
6. Right panel sidebar cards → already exist, token refresh
7. Spacing → consistent `p-lg` padding, `gap-lg` between cards

**Components to use:** Existing `AppointmentCard`, `ActiveHoldsCard`, `RecentClientsCard`, `QuickActionsGrid` (token refresh only)

**New components needed:** None — all exist

**Estimated effort:** Small (token rename + layout proportion fix)

---

### Priority 2 — APPT-01 (Appointments / Schedule)

**What exists:** Split view with appointment list left, detail panel right. Staff filter, sort by status, CreateAppointmentSheet, EditAppointmentSheet, WalkInButton.

**What needs updating:**
1. TopBar → same pattern as Home
2. Filter pills → replace inline Pressables with `Chip` component (on/default variants)
3. Split proportions → left list panel, right detail
4. Staff selector → could use `Chip` or dedicated filter
5. Token migration in AppointmentCard
6. Time column in appointment rows → match the `tl__d` 76px pattern from timeline

**Components to reuse:** `Chip` for filters, `Tag` for status badges, `Button` for actions, `Avatar` for client thumbnails

**New components needed:** None

**Estimated effort:** Medium (chip migration + token rename + layout proportion fix)

---

### Priority 3 — PRD-01 (Products Browser)

**What exists:** Grid layout with search, filter pills, sort options, FlatList of ProductCards. Already close to wireframe (session workspace reuse).

**What needs updating:**
1. Sort pills → replace inline Pressables with `Chip` component
2. Filter button → use `Button variant="ghost"`
3. ProductCard → verify token usage, may need `pcard` anatomy from wireframe (image area + add button + info below)
4. SearchBar → already exists, verify token usage
5. Session-context header → "Browsing for {client}" when session active

**Components to reuse:** `Chip`, `Button`, existing `ProductCard`, `SearchBar`

**New component opportunity:** `ProductGridCard` — the wireframe's `pcard` pattern with:
- Image area (placeholder with product name)
- Overlay "+" add button (bottom-right, 30px circle)
- Selected state (2px brand border on image)
- Info section below (name, price in mono)

**Estimated effort:** Medium (ProductCard update + chip migration)

---

### Priority 4 — PRD-02 (Product Detail Sheet)

**What exists:** Full product detail with image carousel, variant chips, dimensions table, configurator integration. 500 lines.

**What needs updating:**
1. Variant chips → use `Chip` component (replace custom `VariantChip`)
2. Dimensions table → use `RowKV` component
3. Token migration (`text-bodyStrong` → `text-body-md font-medium`)
4. Action bar → use `Button` variants properly (primary: "Try in fitting", ghost: "Wishlist")
5. Price display → `font-mono` class

**Components to reuse:** `Chip`, `RowKV`, `Button`, `Tag` (for stock status), `Card` (for sections)

**Estimated effort:** Medium-Large (structural update to use compound Card + RowKV)

---

### Priority 5 — More Menu + Sub-screens

**What exists:** Menu list with icons, badges, navigation. Settings screen with various controls.

**What needs updating:**
1. MenuRow → token refresh (`text-body` → `text-body-md`, `text-caption` → `text-caption-md`)
2. Section headers → use `FieldLabel`-style uppercase tracking
3. Badge → use `Tag` component or keep custom (it's a notification count, slightly different from Tag)
4. Rx Pipeline/Approvals → token refresh, could use `Card` + `RowKV` + `Tag` for status

**Components to reuse:** `Tag`, `RowKV`, `Button`, `Card`

**Estimated effort:** Small (mostly token rename)

---

## New Components to Create

### 1. `ProductGridCard` (pcard pattern)

The wireframe shows a specific product card for the 4-column catalogue grid that differs from the current `ProductCard`:

```tsx
interface ProductGridCardProps {
  product: Product;
  onAdd?: () => void;
  isInSession?: boolean;  // shows ✓ instead of +
  fitBadge?: 'good' | 'slight' | 'poor';
}
```

Structure:
- Image area (aspect ratio, bg-muted placeholder)
- "+" circle button overlay (bottom-right)
- Selected border (when in session tray)
- Below: product name (text-body-sm font-medium) + price (text-caption-md font-mono text-text-muted)

### 2. `SectionLabel` (reusable section header)

The rail sections and card groups all use this pattern:
```tsx
// text-caption-md tracking-widest uppercase text-text-muted mb-[10px]
<SectionLabel>Quick stats</SectionLabel>
```

This is similar to `FieldLabel` but used outside of forms (in rails, card groups). Could extend FieldLabel or create a dedicated component.

### 3. `TimeSlot` (appointment row for calendar view)

The appointments screen needs a compact time-slot row:
```tsx
interface TimeSlotProps {
  time: string;
  clientName: string;
  service: string;
  duration: number;
  status: AppointmentStatus;
  onPress: () => void;
}
```

---

## Execution Order

| Step | Screen | Effort | Dependency |
|------|--------|--------|------------|
| 1 | Home (today) | S | None — token rename + layout |
| 2 | Products browser | M | ProductGridCard component |
| 3 | Appointments | M | Chip migration |
| 4 | Product detail | M-L | RowKV + Chip usage |
| 5 | More menu + sub-screens | S | Token rename only |

**Total estimated:** ~5-6 days for a thorough pass across all screens.

---

## Token Rename Script

A bulk rename could be done with a script for the most common patterns:

```bash
# Safe renames (class name only, no ambiguity)
text-displayLg → text-display-lg
text-headline  → text-heading-xl  
text-bodyStrong → text-body-md font-medium (manual - two classes)
text-body      → text-body-md (careful - check context)
text-caption   → text-caption-md
```

However, `text-body` and `text-caption` are ambiguous — they could map to different sizes depending on context. These need manual review per-file.

---

## Summary

The Phase 1-6 work established the component vocabulary. Spreading it to remaining screens is primarily:
1. **Token rename** (old → new class names) — mechanical, safe with review
2. **Chip migration** (inline Pressable pills → `<Chip>`) — pattern substitution
3. **Layout proportion fixes** (flex ratios → fixed widths matching wireframe)
4. **Card/RowKV adoption** (replace custom layouts with compound Card pattern)

No new API hooks needed. No new type definitions. Just visual consistency using components that now exist.

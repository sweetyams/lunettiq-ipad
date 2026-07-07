---
inclusion: always
---
# Design System — Lunettiq iPad

## The Hybrid Rule

**Structure and behaviour are iOS-native; content and identity are Lunettiq.**

The app should feel like a first-party Apple app wearing Lunettiq's clothes. One sentence decides every design argument.

### What stays native (never rebrand)

- Sheets and modals — UIKit-style detent sheets, grabber handle, pull-down to dismiss
- Navigation transitions — Standard push/pop, sheet spring, no custom easing
- Bars — Blur material, hairline borders
- Controls — Native switches, segmented controls, context menus, date pickers
- Keyboard, focus, selection — System behaviour untouched
- Haptics and sounds — System haptics

### What gets branded (never system-default)

- Typography — Helvetica Now Display (headings), Helvetica Neue (body)
- Colors — Brand tokens, no system blue anywhere
- Photography — Editorial, full-bleed where possible, no borders on images
- Buttons — Brand-filled, rounded-lg, semantic colors
- Empty states — Brand line-art style

## Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0A153D` | Primary backgrounds, headers, buttons |
| `green` | `#005D23` | **ONE accent only** — single primary action per screen |
| `offWhite` | `#F5F2EC` | Page backgrounds |
| `warmGrey` | `#E8E4DE` | Borders, dividers, secondary backgrounds |
| `charcoal` | `#2B2B2B` | Body text |
| `midGrey` | `#6B6B6B` | Secondary text, captions |
| `white` | `#FFFFFF` | Card backgrounds, inverse text |
| `error` | `#C53030` | Destructive actions, errors |
| `warning` | `#D4A017` | Offline indicator, low stock |
| `blue` | `#2D4A8A` | Info states, "liked" verdict |

### Verdict Colors

| Verdict | Color | Note |
|---------|-------|------|
| Loved | `green` (#005D23) | Success color |
| Liked | `blue` (#2D4A8A) | Info color |
| Unsure | `warning` (#D4A017) | Warning color |
| Rejected | `midGrey` (#6B6B6B) | Data, not error |

## Typography Scale

Minimum body: **17pt** (client may not have glasses on).

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `displayLg` | 34pt | Bold | Page titles |
| `displayMd` | 28pt | Bold | Section headers |
| `headline` | 22pt | Semibold | Card titles, product names |
| `body` | 17pt | Regular | Default text |
| `bodyStrong` | 17pt | Medium | Labels, nav items |
| `caption` | 14pt | Regular | Metadata, timestamps |
| `captionStrong` | 14pt | Medium | Badges, tags |

Font stack: Helvetica Now Display (headings), Helvetica Neue (body). Fallback: system font.

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Micro gaps |
| `sm` | 8px | Icon-text gaps, tight groups |
| `md` | 16px | Card padding, between fields |
| `lg` | 24px | Between cards, sections |
| `xl` | 32px | Major page sections |
| `2xl` | 48px | Page margins |

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Small indicators |
| `md` | 10px | Buttons, inputs, pills |
| `lg` | 14px | Cards, panels |
| `full` | 9999px | Avatars, badges, pills |

## Touch Targets

**Minimum 44pt × 44pt.** No exceptions. This is Apple HIG and accessibility requirement.

## One-Accent Rule

Green (`#005D23`) appears **only** on the single most important affirmative action visible per screen. Everything else is navy or neutral. This creates clear visual hierarchy and prevents color chaos.

## Elevation Model (Border-Based Depth)

No custom shadows. Depth comes from borders and background levels, following Foundry's approach:

| Level | Treatment | Usage |
|-------|-----------|-------|
| 0 | Flat surface | Page background |
| 1 | `border border-warmGrey` or `ring-1 ring-warmGrey` | Cards, panels |
| 2 | Blur material + hairline | Sticky bars, floating elements |
| 3 | System sheet shadow | Native modals only |

```tsx
// ✅ Correct — border-based cards
<View className="bg-white rounded-lg border border-warmGrey">

// ❌ Wrong — custom shadows
<View className="bg-white rounded-lg shadow-md">
```

## Iconography (Lucide Icons)

Fixed vocabulary — one icon per concept, app-wide using `lucide-react-native`:

| Concept | Icon | Concept | Icon |
|---------|------|---------|------|
| Privacy: staff | `Eye` | Capture | `Camera` |
| Privacy: client | `EyeOff` | Barcode scan | `ScanLine` |
| Sync OK | `CloudCheck` | Compare | `Grid` |
| Sync pending | `CloudUpload` | Shortlist | `Star` |
| Sync error | `CloudOff` | Verdict loved | `Heart` |
| Client | `User` | Verdict liked | `ThumbsUp` |
| Session | `Users` | Verdict unsure | `HelpCircle` |
| Appointment | `Calendar` | Verdict rejected | `XCircle` |
| Second Sight | `ArrowUpDown` | Hand to client | `Hand` |

## Component Anatomy

### Button (● mandatory states)

```tsx
// Variants
primary: bg-green text-white     // ONE per screen only
secondary: bg-navy text-white    // Navigation actions  
ghost: transparent border        // Cancel, alternatives
danger: transparent text-error   // Destructive actions

// ● States (all mandatory)
default | pressed (0.96 scale, 120ms) | disabled (40% opacity) | loading (spinner)
```

### ProductCard (● mandatory states)

```tsx
// Structure: Image (1:1) + Name + Color count + Price + StockDot + FitBadge
// ● States
default | pressed | out-of-stock (60% opacity) | owned (70% opacity + badge) | skeleton
// ● Privacy: price hidden in client mode → "Tap for price"
```

### AppointmentCard (● mandatory states)

```tsx
// Structure: Time + Client name + Type/duration + Status badge + Actions
// ● States  
scheduled | confirmed | in-progress (green left edge) | completed | no-show
```

### FilterPillRow (● mandatory states)

```tsx
// Horizontal scroll, multi-select
// ● States
default (border only) | selected (filled) | disabled
```

### Sheet (● mandatory states)

```tsx
// Native detent sheets with grabber
// ● States
70% detent | full height | blocked-dismiss (mid-save)
```

### ActionBar (● mandatory states)

```tsx
// Sticky bottom, blur material, max 3 actions
// ● States
default | privacy-mode-filtered (actions re-evaluate)
```

### VerdictControl (● mandatory states)

```tsx
// Four-segment: loved/liked/unsure/rejected with verdict colors
// ● States
unset | each verdict | client-voice (shows client icon when set in client mode)
```

### ShelfThumbnail (● mandatory states)

```tsx
// Fitting photo with product link + verdict
// ● States
linked | unlinked | uploading (progress) | verdict-set | selected | no-photo
```

### ConsentModal (● mandatory states)

```tsx
// Non-dismissible at first capture
// ● States
initial | agreed | declined
```

## Motion Table

| Motion | Duration | Curve | Notes |
|--------|----------|-------|-------|
| Sheet present/dismiss | System spring | System | Never customize |
| Push/pop | System | System | Never customize |
| Privacy crossfade | 90ms | ease-out | Under 100ms budget |
| Card press | 120ms | ease-out | Scale 0.96 |
| Verdict set | 180ms | ease-out | Color fill + haptic |
| Skeleton pulse | 1.2s loop | ease-in-out | Opacity 0.5 → 0.8 |

**Reduce Motion:** All springs become 150ms crossfades. Nothing else moves.

## Voice & Copy Rules

- **Sentence case** everywhere except badges
- **Verbs on buttons** — "Start session" not "Session"
- **No emoji, no exclamation marks** — brand register
- **Client-visible mode** addresses client: "Your shortlist"
- **Staff mode** addresses SA: "Marie's shortlist"  
- **Bilingual** — EN/FR for client-facing (consent, summaries), EN-only staff chrome

## Privacy Mode Visual Rules

Visual indicators for the two privacy modes:

### Staff Mode
- **2pt navy strip** at very top of screen
- **Eye icon** in top bar
- All data visible

### Client-Visible Mode  
- **6pt green strip** at very top with "CLIENT VIEW" label (white text)
- **EyeOff icon** in top bar
- Sensitive data hidden or greyed with lock icon + "Switch to staff view"

## Component Tokens (NativeWind)

```tsx
// ✅ Correct — semantic classes with border-based depth
<View className="bg-white rounded-lg border border-warmGrey p-md">
<Text className="text-charcoal text-body font-medium">

// ✅ Buttons
<Pressable className="bg-green rounded-md px-lg py-sm"> {/* Primary */}
<Pressable className="bg-navy rounded-md px-lg py-sm">  {/* Secondary */}
<Pressable className="border border-warmGrey rounded-md px-lg py-sm"> {/* Ghost */}

// ✅ Cards with Foundry-style borders
<View className="bg-white rounded-lg ring-1 ring-warmGrey">

// ❌ Wrong — hardcoded values or shadows  
<View style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
```

## Client-Visible Mode Constraints

When privacy mode is set to client-visible:
- **Larger type:** body becomes 20pt, headings scale proportionally
- **Higher contrast:** AAA where possible (client may not have glasses)
- **Price hiding:** No prices unless explicitly tapped
- **Data filtering:** No LTV, internal tags, return rates, private notes
- **Visual indicator:** 6pt green strip + "CLIENT VIEW" label

## Quality Bars

1. **Nothing decorative moves** — Motion only for state or hierarchy
2. **One accent per screen** — Green only on single primary action  
3. **Photography wins layout fights** — Images get maximum area, chrome shrinks around them
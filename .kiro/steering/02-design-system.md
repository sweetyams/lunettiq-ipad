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

- Typography — Roboto (matches Lunettiq storefront, loaded via Google Fonts)
- Colors — Storefront design tokens only, no system blue anywhere
- Photography — Editorial, full-bleed where possible, no borders on images
- Buttons — Brand-filled, rounded-lg, semantic tokens
- Empty states — Brand line-art style

---

## Color Token Constraint Rules (HARD)

**These rules are not guidelines. Violations must be fixed before merge.**

### Rule 1 — No hardcoded colors, ever

```tsx
// ✅ Token className
<View className="bg-color-bg-surface border border-color-border">

// ✅ Token via style when className isn't possible (e.g. dynamic opacity)
<View style={{ backgroundColor: colors['color-brand'] }}>  // colors from useDesignTokens()

// ❌ BANNED — hardcoded hex in style prop
<View style={{ backgroundColor: '#000EC7' }}>

// ❌ BANNED — hardcoded rgba in style prop
<View style={{ color: 'rgba(23,23,23,0.65)' }}>

// ❌ BANNED — hardcoded hex in className (not a token name)
<View className="bg-[#F5F5F5]">
```

ESLint rule `no-hardcoded-colors` (see `.eslintrc.js`) rejects bare hex/rgba in `style={}` props. The Tailwind `bg-[#...]` syntax is disabled in the Tailwind config.

### Rule 2 — Token names mirror Foundry's --color-* vars

Every color used in the app must exist as a named token in `tailwind.config.js`. Token names are the CSS var name minus `--`, e.g. `--color-brand` → `color-brand` → `bg-color-brand` / `text-color-brand`.

If you need a color that doesn't have a token:
1. Check if an existing token fits semantically
2. If not, propose adding a new iPad-specific token to `tailwind.config.js` under the `# iPad-specific semantic tokens` section
3. Never use a raw color value

### Rule 3 — Source of truth for all values

Colors live in exactly one place: `tailwind.config.js`. Their values are kept in sync with:
- `foundry/src/lib/design/tenant-brand.ts` → `TENANT_BRAND.lunettiq`
- `foundry/src/lib/design/lunettiq-typography.ts` → `LUNETTIQ_TYPOGRAPHY`
- `foundry/src/lib/design/tenant-fonts.ts` → `TENANT_FONTS.lunettiq`

When Lunettiq's brand changes in Foundry, update `tailwind.config.js` to match. The runtime fetch path (V2) is `GET /api/design/full` with Bearer token — not yet implemented.

---

## Brand Palette

All tokens are defined in `tailwind.config.js`. Values are exact matches of `TENANT_BRAND.lunettiq` in Foundry.

### Storefront Core Tokens (23)

#### Backgrounds

| Token class | Value | Usage |
|---|---|---|
| `bg-color-bg-page` | `#FFFFFF` | Page/screen background |
| `bg-color-bg-surface` | `#FFFFFF` | Cards, panels, modals |
| `bg-color-bg-surface-hover` | `#FAFAFA` | Hovered surface state |
| `bg-color-bg-muted` | `#F5F5F5` | Secondary backgrounds, disabled states |
| `bg-color-bg-inverse` | `#0A0A0A` | Dark panels, chrome surfaces |

#### Text

| Token class | Value | Usage |
|---|---|---|
| `text-color-text-primary` | `#171717` | Primary body text |
| `text-color-text-secondary` | `#404040` | Supporting text, labels |
| `text-color-text-muted` | `#737373` | Metadata, timestamps, placeholders |
| `text-color-text-inverse` | `#FAFAFA` | Text on dark/inverse backgrounds |

#### Borders

| Token class | Value | Usage |
|---|---|---|
| `border-color-border` | `#D4D4D4` | Card borders, dividers, inputs |
| `border-color-border-inverse` | `rgba(255,255,255,0.18)` | Borders on dark surfaces |
| `ring-color-focus-ring` | `#0010DF` | Focus indicators |

#### Brand — Lunettiq electric blue

| Token class | Value | Usage |
|---|---|---|
| `bg-color-brand` | `#000EC7` | Primary action buttons, active states |
| `bg-color-brand-hover` | `#000CA3` | Brand button hover/pressed |
| `text-color-brand-text` | `#FFFFFF` | Text on brand-colored surfaces |

#### Accent — dark neutral

| Token class | Value | Usage |
|---|---|---|
| `bg-color-accent` | `#525252` | Secondary actions, ghost button fills |
| `bg-color-accent-hover` | `#404040` | Accent hover state |
| `text-color-accent-text` | `#FFFFFF` | Text on accent surfaces |

#### Feedback

| Token class | Value | Usage |
|---|---|---|
| `text-color-error` / `bg-color-error` | `#DC2626` | Errors, destructive actions |
| `text-color-success` / `bg-color-success` | `#16A34A` | Confirmations, success states |
| `text-color-warning` / `bg-color-warning` | `#CA8A04` | Offline indicator, low stock |
| `bg-color-sale` | `#DC2626` | Price reductions (same as error) |

#### Skeleton

| Token class | Value | Usage |
|---|---|---|
| `bg-color-skeleton-bg` | `#F5F5F5` | Skeleton placeholder base |
| `bg-color-skeleton-shimmer` | `#FAFAFA` | Skeleton shimmer pass |

---

### iPad-Specific Semantic Tokens

These extend the storefront set for iPad-only concepts. All values are derived from storefront tokens — no new raw colors introduced.

#### Verdict Colors (fitting session)

| Token | Storefront source | Usage |
|---|---|---|
| `bg-verdict-loved` / `text-verdict-loved` | `color-success` (`#16A34A`) | Loved verdict |
| `bg-verdict-liked` / `text-verdict-liked` | `color-brand` (`#000EC7`) | Liked verdict |
| `bg-verdict-unsure` / `text-verdict-unsure` | `color-warning` (`#CA8A04`) | Unsure verdict |
| `bg-verdict-rejected` / `text-verdict-rejected` | `color-text-muted` (`#737373`) | Rejected (neutral, not error) |

#### Privacy Mode Indicators

| Token | Value | Usage |
|---|---|---|
| `bg-mode-staff` | `#000EC7` (= `color-brand`) | 2pt strip, staff mode |
| `bg-mode-client` | `#16A34A` (= `color-success`) | 6pt strip, CLIENT VIEW |

#### Staff Chrome

| Token | Value | Usage |
|---|---|---|
| `bg-chrome-bg` | `#0A0A0A` (= `color-bg-inverse`) | Dark panel backgrounds |
| `text-chrome-text` | `#FAFAFA` (= `color-text-inverse`) | Text on dark panels |
| `border-chrome-border` | `rgba(255,255,255,0.18)` (= `color-border-inverse`) | Borders on dark panels |

#### Overlay

| Token | Value | Usage |
|---|---|---|
| `bg-color-overlay` | `rgba(10,10,10,0.5)` | Modal scrims, privacy overlay |

---

## One-Accent Rule

`color-brand` (`#000EC7`) appears **only** on the single most important affirmative action visible per screen. Everything else is neutral. This creates clear visual hierarchy and prevents color chaos.

---

## Typography Scale

**Minimum body: 17pt (18px)** — client may not have glasses on. `body-md` (16px) is staff-only UI.

Font: **Roboto** (matches Lunettiq storefront). Loaded via Google Fonts at app boot. Fallback: Inter → Helvetica Neue → system sans-serif.

| Token class | Size | Line | Weight | Usage |
|---|---|---|---|---|
| `text-display-xxl` | 90px | 90px | 400 | Hero titles (rare) |
| `text-display-xl` | 72px | 76px | 400 | Page-level titles |
| `text-display-lg` | 48px | 60px | 400 | Section headlines |
| `text-display-md` | 36px | 44px | 400 | Feature callouts |
| `text-display-sm` | 30px | 38px | 400 | Card headings |
| `text-heading-xl` | 28px | 34px | 400 | Screen titles |
| `text-heading-lg` | 24px | 32px | 400 | Panel headings |
| `text-heading-md` | 20px | 30px | 400 | Section titles |
| `text-heading-sm` | 18px | 28px | 400 | Sub-headings |
| `text-heading-xs` | 16px | 24px | 400 | Small labels |
| `text-body-xl` | 20px | 30px | 400 | Client-visible body |
| `text-body-lg` | 18px | 28px | 400 | **Default body** (17pt min met) |
| `text-body-md` | 16px | 24px | 400 | Staff-only UI text |
| `text-body-sm` | 14px | 20px | 400 | Metadata, secondary info |
| `text-body-xs` | 12px | 18px | 400 | Timestamps, status badges |
| `text-caption-lg` | 14px | 20px | 400 | Long captions |
| `text-caption-md` | 12px | 18px | 400 | Short captions |
| `text-caption-sm` | 11px | 16px | 400 | Mono — labels, codes (`font-mono`) |
| `text-caption-xs` | 10px | 14px | 400 | Mono — tiny metadata (`font-mono`) |

**Display tokens** (`display-*`) use `-0.02em` letter-spacing. All others: no extra tracking.

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `p-xs` / `gap-xs` | 4px | Micro gaps, icon-text spacing |
| `p-sm` / `gap-sm` | 8px | Tight groups, pill padding |
| `p-md` / `gap-md` | 16px | Card padding, between form fields |
| `p-lg` / `gap-lg` | 24px | Between cards, sections |
| `p-xl` / `gap-xl` | 32px | Major page sections |
| `p-2xl` / `gap-2xl` | 48px | Page margins |

---

## Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 6px | Small indicators, tags |
| `rounded-md` | 10px | Buttons, inputs, pills |
| `rounded-lg` | 14px | Cards, panels |
| `rounded-full` | 9999px | Avatars, badges |

---

## Touch Targets

**Minimum 44pt × 44pt.** No exceptions. Apple HIG and accessibility requirement.

```tsx
// ✅ Correct
<Pressable className="min-w-[44px] min-h-[44px] p-sm" hitSlop={8}>

// ❌ Wrong — too small
<Pressable className="p-xs">
```

---

## Elevation Model (Border-Based Depth)

No custom shadows. Depth comes from borders and background levels.

| Level | Treatment | Usage |
|---|---|---|
| 0 | Flat surface | Page background (`color-bg-page`) |
| 1 | `border border-color-border` | Cards, panels |
| 2 | Blur material + `border-color-border` hairline | Sticky bars, floating elements |
| 3 | System sheet shadow | Native modals only |

```tsx
// ✅ Correct — border-based card
<View className="bg-color-bg-surface rounded-lg border border-color-border">

// ✅ Correct — ring variant
<View className="bg-color-bg-surface rounded-lg ring-1 ring-color-border">

// ❌ Wrong — custom shadow
<View className="bg-color-bg-surface rounded-lg shadow-md">

// ❌ Wrong — hardcoded border color
<View style={{ borderColor: '#D4D4D4' }}>
```

---

## Iconography (Lucide Icons)

Fixed vocabulary — one icon per concept, app-wide using `lucide-react-native`:

| Concept | Icon | Concept | Icon |
|---|---|---|---|
| Privacy: staff | `Eye` | Capture | `Camera` |
| Privacy: client | `EyeOff` | Barcode scan | `ScanLine` |
| Sync OK | `CloudCheck` | Compare | `Grid` |
| Sync pending | `CloudUpload` | Shortlist | `Star` |
| Sync error | `CloudOff` | Verdict loved | `Heart` |
| Client | `User` | Verdict liked | `ThumbsUp` |
| Session | `Users` | Verdict unsure | `HelpCircle` |
| Appointment | `Calendar` | Verdict rejected | `XCircle` |
| Second Sight | `ArrowUpDown` | Hand to client | `Hand` |

---

## Component Anatomy

### Button (● mandatory states)

```tsx
// Variants — token classes only, no hardcoded colors
primary:   className="bg-color-brand rounded-md px-lg py-sm"       // text-color-brand-text
secondary: className="bg-color-bg-inverse rounded-md px-lg py-sm"  // text-color-text-inverse
ghost:     className="border border-color-border rounded-md px-lg py-sm" // text-color-text-primary
danger:    className="border border-color-error rounded-md px-lg py-sm"  // text-color-error

// ● States (all mandatory)
default | pressed (0.96 scale, 120ms) | disabled (40% opacity) | loading (spinner)
// ONE primary button per screen only
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
scheduled | confirmed | in-progress (bg-color-brand left edge) | completed | no-show
```

### VerdictControl (● mandatory states)

```tsx
// Four-segment: loved/liked/unsure/rejected
// Use verdict-* token classes — never hardcode verdict colors
<View className="bg-verdict-loved">   {/* loved */}
<View className="bg-verdict-liked">   {/* liked */}
<View className="bg-verdict-unsure">  {/* unsure */}
<View className="bg-verdict-rejected">{/* rejected */}

// ● States: unset | each verdict | client-voice (client icon when set in HANDED mode)
```

### Privacy Mode Strip

```tsx
// Staff mode — 2pt brand strip at top
<View className="h-[2px] bg-mode-staff" />

// Client-visible mode — 6pt strip with label
<View className="h-[6px] bg-mode-client">
  <Text className="text-color-text-inverse text-caption-xs font-mono">CLIENT VIEW</Text>
</View>
```

---

## Component Token Quick Reference

```tsx
// ─── Surfaces ───────────────────────────────────────────────
<View className="bg-color-bg-page" />                      // Screen background
<View className="bg-color-bg-surface rounded-lg border border-color-border" />  // Card
<View className="bg-color-bg-muted rounded-md" />          // Secondary surface
<View className="bg-color-bg-inverse" />                   // Dark panel / chrome

// ─── Text ───────────────────────────────────────────────────
<Text className="text-color-text-primary text-body-lg" />        // Default body
<Text className="text-color-text-secondary text-body-sm" />      // Supporting text
<Text className="text-color-text-muted text-caption-md" />       // Metadata
<Text className="text-color-text-inverse text-body-lg" />        // On dark bg

// ─── Buttons ────────────────────────────────────────────────
<Pressable className="bg-color-brand rounded-md px-lg py-sm">    // Primary — ONE per screen
<Pressable className="bg-color-bg-inverse rounded-md px-lg py-sm"> // Secondary
<Pressable className="border border-color-border rounded-md px-lg py-sm"> // Ghost
<Pressable className="border border-color-error rounded-md px-lg py-sm">  // Danger

// ─── Feedback ───────────────────────────────────────────────
<Text className="text-color-error" />
<Text className="text-color-success" />
<Text className="text-color-warning" />

// ─── Skeleton ───────────────────────────────────────────────
<View className="bg-color-skeleton-bg rounded-md animate-pulse" />

// ─── BANNED — never write these ─────────────────────────────
<View style={{ backgroundColor: '#000EC7' }} />            // ❌ hardcoded hex
<View style={{ color: 'rgba(23,23,23,0.65)' }} />          // ❌ hardcoded rgba
<View className="bg-[#F5F5F5]" />                          // ❌ Tailwind arbitrary value
```

---

## Client-Visible Mode Constraints

When privacy mode is set to client-visible:
- **Larger type:** use `text-body-xl` (20px) as base instead of `text-body-lg` (18px), headings scale proportionally
- **Higher contrast:** AAA where possible (client may not have glasses)
- **Price hiding:** no prices unless explicitly tapped
- **Data filtering:** no LTV, internal tags, return rates, private notes
- **Visual indicator:** `bg-mode-client` 6pt strip + "CLIENT VIEW" label in `text-color-text-inverse`

---

## Privacy Mode Visual Rules

### Staff Mode
- `bg-mode-staff` (= `color-brand`) 2pt strip at very top of screen
- `Eye` icon in top bar
- All data visible

### Client-Visible Mode
- `bg-mode-client` (= `color-success`) 6pt strip at very top with "CLIENT VIEW" label
- `EyeOff` icon in top bar
- Sensitive data hidden or greyed with lock icon

---

## Motion Table

| Motion | Duration | Curve | Notes |
|---|---|---|---|
| Sheet present/dismiss | System spring | System | Never customize |
| Push/pop | System | System | Never customize |
| Privacy crossfade | 90ms | ease-out | Under 100ms budget |
| Card press | 120ms | ease-out | Scale 0.96 |
| Verdict set | 180ms | ease-out | Color fill + haptic |
| Skeleton pulse | 1.2s loop | ease-in-out | Opacity 0.5 → 0.8 |

**Reduce Motion:** All springs become 150ms crossfades. Nothing else moves.

---

## Voice & Copy Rules

- **Sentence case** everywhere except badges
- **Verbs on buttons** — "Start session" not "Session"
- **No emoji, no exclamation marks** — brand register
- **Client-visible mode** addresses client: "Your shortlist"
- **Staff mode** addresses SA: "Marie's shortlist"
- **Bilingual** — EN/FR for client-facing (consent, summaries), EN-only staff chrome

---

## Quality Bars

1. **No hardcoded colors anywhere** — ESLint `no-hardcoded-colors` must pass
2. **Token names mirror Foundry** — `color-brand`, not `navy` or `primary`
3. **One accent per screen** — `color-brand` only on single primary action
4. **Nothing decorative moves** — motion only for state or hierarchy
5. **Photography wins layout fights** — images get maximum area, chrome shrinks around them

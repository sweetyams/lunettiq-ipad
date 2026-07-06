---
inclusion: always
---
# Design System — Lunettiq iPad

## Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0A153D` | Primary backgrounds, headers, buttons |
| `green` | `#005D23` | Accent, success, tier badges |
| `offWhite` | `#F5F2EC` | Page backgrounds, cards |
| `warmGrey` | `#E8E4DE` | Borders, dividers, secondary backgrounds |
| `charcoal` | `#2B2B2B` | Body text |
| `midGrey` | `#6B6B6B` | Secondary text, captions |
| `white` | `#FFFFFF` | Card backgrounds, inverse text |
| `error` | `#C53030` | Destructive actions, errors |

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

Font stack: Helvetica Now Display (headings), Helvetica Now Text (body). Fallback: system font.

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
| `md` | 10px | Buttons, inputs |
| `lg` | 14px | Cards, panels |
| `full` | 9999px | Avatars, badges, pills |

## Touch Targets

**Minimum 44pt × 44pt.** No exceptions. This is Apple HIG and accessibility requirement.

## Dark Mode

Supported but secondary. Store lighting usually favours light mode. Define both appearances for all colors.

## Component Tokens (NativeWind)

```tsx
// ✅ Correct — semantic class names
<View className="bg-offWhite p-md rounded-lg">
<Text className="text-charcoal text-body">

// ❌ Wrong — hardcoded values
<View style={{ backgroundColor: '#F5F2EC', padding: 16, borderRadius: 14 }}>
```

## Elevation / Shadow

| Level | Usage | Shadow |
|-------|-------|--------|
| 0 | Flat surfaces | None |
| 1 | Cards | `shadow-sm` (subtle) |
| 2 | Floating panels, sheets | `shadow-md` |
| 3 | Modals, overlays | `shadow-lg` |

## Client-Visible Mode Constraints

When privacy mode is set to client-visible:
- Larger type: body becomes 20pt, headings scale up proportionally
- Higher contrast (AAA where possible)
- No price information unless explicitly tapped
- No internal tags, LTV, return rates, or private notes
- Subtle colored bar at top indicates mode is active

## No in UI

- No emoji (brand register)
- No loading spinners > 2 seconds (show skeleton states)
- No system alert dialogs (use custom branded modals)
- No small type (< 14pt anywhere, even captions)

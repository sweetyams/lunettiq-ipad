# Design System Migration — iPad → Foundry

## Executive Summary

The iPad app has a **custom design system** (navy/green palette, system fonts, flat hex tokens) that diverges from **Foundry's actual design system** (semantic CSS variables served per-tenant). This creates a brand split: the storefront looks different from the in-store iPad.

**Goal:** Converge the iPad app to Foundry's design system so the app feels like the same brand as the website. One source of truth, fetched at runtime from `/api/design/css`.

**Blast radius:** 61 files, ~670 color class usages, 25 UI components.

---

## Current State: Two Worlds

### iPad (custom, hardcoded)
| Token | Value | Usage count |
|-------|-------|-------------|
| `navy` | #0A153D | Buttons, headers, backgrounds |
| `green` | #005D23 | Single primary action per screen |
| `offWhite` | #F5F2EC | Page backgrounds |
| `warmGrey` | #E8E4DE | Borders, dividers |
| `charcoal` | #2B2B2B | Body text |
| `midGrey` | #6B6B6B | Secondary text |
| `error` | #C53030 | Destructive |
| `warning` | #D4A017 | Warnings |
| `blue` | #2D4A8A | Info/liked |
| Font | -apple-system | System font stack |

Plus 13 "legacy" tokens (`background`, `foreground`, `muted`, etc.) that are stale copies.

### Foundry (live, from DB, served per-tenant)
| Token | Value (Lunettiq live) |
|-------|----------------------|
| `--color-brand` | #1D1F21 |
| `--color-accent` | #023891 |
| `--color-bg-page` | #FFFFFF |
| `--color-bg-surface` | #F8F6F7 |
| `--color-text-primary` | #1D1F21 |
| `--color-text-secondary` | rgba(29,31,33,0.65) |
| `--color-text-muted` | rgba(29,31,33,0.45) |
| `--color-border` | rgba(17,17,17,0.18) |
| `--color-error` | #B42318 |
| `--color-success` | #067647 |
| `--color-warning` | #B54708 |
| Font | General Sans |

---

## Token Mapping

| iPad Token | → Foundry Token | Visual Change |
|-----------|----------------|---------------|
| `navy` (#0A153D) | `brand` (#1D1F21) | Dark blue → near-black |
| `green` (#005D23) | `accent` (#023891) | Forest green → deep blue |
| `offWhite` (#F5F2EC) | `bg-page` (#FFFFFF) | Warm beige → clean white |
| `warmGrey` (#E8E4DE) | `border` (rgba(17,17,17,0.18)) | Solid beige → transparent grey |
| `charcoal` (#2B2B2B) | `text-primary` (#1D1F21) | Nearly identical ✓ |
| `midGrey` (#6B6B6B) | `text-muted` (rgba(29,31,33,0.45)) | Similar tone |
| `error` (#C53030) | `error` (#B42318) | Slight shift |
| `warning` (#D4A017) | `warning` (#B54708) | Gold → amber |
| `blue` (#2D4A8A) | `accent` (#023891) | Very close ✓ |
| `background` | `bg-page` | Direct replace |
| `foreground` | `text-primary` | Direct replace |
| `muted` | `text-muted` | Direct replace |
| `border` | `border` | Direct replace |
| `surface` | `bg-surface` | Direct replace |

### Missing in Foundry (iPad needs to add)
| Need | Solution |
|------|----------|
| "Liked" verdict color | Keep `blue` as app-specific verdict token |
| Privacy mode strip colors | Derive from brand/accent |
| Skeleton shimmer | Use `--color-skeleton-bg` / `--color-skeleton-shimmer` |

---

## The Architecture Change

**Before:** Tokens hardcoded in `tailwind.config.js`
**After:** Tokens fetched from Foundry API at startup, injected as CSS variables, referenced by Tailwind

```
App boot → fetch /api/design/css → parse CSS variables → inject into NativeWind theme → all components update
```

This means if Lunettiq changes their brand in the admin panel, the iPad app updates automatically.

---

## Aggressive 3-Phase Migration (5 days total)

### Phase 1 — Foundation (Day 1-2)

**Replace tailwind.config.js tokens with Foundry's semantic naming:**

```javascript
// tailwind.config.js — NEW
module.exports = {
  theme: {
    extend: {
      colors: {
        // Foundry semantic tokens (values fetched at runtime, these are defaults)
        brand: {
          DEFAULT: '#1D1F21',
          hover: '#1D1F21',
          text: '#FFFFFF',
          soft: 'rgba(17,17,17,0.08)',
        },
        accent: {
          DEFAULT: '#023891',
          hover: '#022e78',
          text: '#FFFFFF',
        },
        bg: {
          page: '#FFFFFF',
          surface: '#F8F6F7',
          'surface-hover': '#F8F6F7',
          muted: '#F8F6F7',
          inverse: '#111111',
          elevated: '#FFFFFF',
          overlay: 'rgba(17,17,17,0.5)',
        },
        text: {
          primary: '#1D1F21',
          secondary: 'rgba(29,31,33,0.65)',
          tertiary: 'rgba(29,31,33,0.55)',
          muted: 'rgba(29,31,33,0.45)',
          inverse: '#FFFFFF',
          link: '#1D1F21',
          error: '#B42318',
        },
        border: {
          DEFAULT: 'rgba(17,17,17,0.18)',
          hover: 'rgba(17,17,17,0.28)',
          strong: 'rgba(17,17,17,0.24)',
          inverse: 'rgba(255,255,255,0.18)',
        },
        // Feedback
        error: '#B42318',
        success: '#067647',
        warning: '#B54708',
        sale: '#B42318',
        // App-specific (no Foundry equiv)
        verdict: {
          loved: '#067647',   // success green
          liked: '#023891',   // accent blue
          unsure: '#B54708',  // warning
          rejected: 'rgba(29,31,33,0.45)', // text-muted
        },
        skeleton: {
          bg: '#F7F5F2',
          shimmer: '#EFEEE9',
        },
      },
    },
  },
};
```

**Files touched:** `tailwind.config.js`, `global.css`
**Migration script:** Find-and-replace in all 61 files:

| Find | Replace |
|------|---------|
| `bg-navy` | `bg-brand` |
| `bg-green` | `bg-accent` |
| `bg-offWhite` | `bg-bg-page` |
| `bg-warmGrey` | `bg-border` |
| `bg-background` | `bg-bg-page` |
| `bg-surface` | `bg-bg-surface` |
| `text-navy` | `text-brand` |
| `text-green` | `text-accent` |
| `text-charcoal` | `text-text-primary` |
| `text-midGrey` | `text-text-muted` |
| `text-foreground` | `text-text-primary` |
| `text-muted` | `text-text-muted` |
| `text-error` | `text-error` |
| `text-white` | `text-text-inverse` |
| `border-warmGrey` | `border-border` |
| `border-border` | `border-border` (already correct) |
| `ring-warmGrey` | `ring-border` |

### Phase 2 — Typography + Font (Day 3)

**Replace iPad's 7-token type scale with Foundry's 19-token scale.**

iPad tokens → Foundry equivalents:
| iPad | → Foundry |
|------|-----------|
| `displayLg` (34px) | `heading-xl` (28px) or `display-sm` (30px) |
| `displayMd` (28px) | `heading-xl` (28px) |
| `headline` (22px) | `heading-lg` (24px) |
| `body` (17px) | `body-lg` (18px) — keeps ≥17pt min |
| `bodyStrong` (17px/500) | `body-lg` + `font-medium` |
| `caption` (14px) | `body-sm` (14px) |
| `captionStrong` (14px/500) | `body-sm` + `font-medium` |

**Font change:** Replace system font with General Sans (loaded from Fontshare CDN or bundled).

```javascript
fontFamily: {
  sans: ['"General Sans"', '-apple-system', 'system-ui', 'sans-serif'],
  display: ['"General Sans"', '-apple-system', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
},
```

**Action:** Add `expo-font` with General Sans loaded at app startup.

### Phase 3 — Runtime Token Fetch + Cleanup (Day 4-5)

**Wire up live token fetching from Foundry:**

```typescript
// src/design/useDesignTokens.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, { font: string; size: string; line: string; weight: string }>;
  fonts: { display: string; body: string };
}

export function useDesignTokens() {
  return useQuery({
    queryKey: ['design-tokens'],
    queryFn: () => api.get<DesignTokens>('/api/design/tokens'),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24h
    gcTime: Infinity,
  });
}
```

**Or simpler:** Fetch the CSS string from `/api/design/css`, parse the variables, inject into NativeWind's runtime theme.

**Cleanup:**
- Remove all legacy tokens from `tailwind.config.js`
- Remove old color references from steering docs
- Update `02-design-system.md` steering to reference Foundry tokens
- Delete the "Brand Palette" table from steering (it's now dynamic)

---

## File-by-File Impact (sorted by effort)

### High-touch files (>15 color refs each, rewrite UI):
| File | Refs | Notes |
|------|------|-------|
| `app/(app)/clients/[id].tsx` | 48 | Client profile — heavy text colors |
| `CustomDesignFlow.tsx` | 48+13 | Wizard steps |
| `app/(app)/clients/index.tsx` | 38 | Client list |
| `SecondSightFlow.tsx` | 38+14 | Trade-in wizard |
| `AppointmentDetailPanel.tsx` | 24+11 | Detail view |
| `EndSessionFlow.tsx` | 23+6 | End session wizard |

### UI components (fix once, ripples everywhere):
| Component | Impact |
|-----------|--------|
| `Button.tsx` | bg-green→bg-accent, bg-navy→bg-brand |
| `AppointmentCard.tsx` | 7+11 refs |
| `ProductCard.tsx` | 3+7 refs |
| `LoadingState.tsx` | 11 bg refs (skeleton) |
| `TopBar.tsx` | 1+4 refs |
| `ModeStrip.tsx` | 4+2 refs |

---

## Decision Points (Need Your Call)

1. **Visual identity shift:** iPad currently has a distinctive dark-navy/forest-green luxury feel. Foundry's storefront brand is near-black/deep-blue — more minimal. Are you ok with converging? The storefront IS the brand.

2. **offWhite (#F5F2EC) → pure white (#FFFFFF)?** The warm ivory tone is an iPad-specific luxury touch. Foundry uses clean white. This changes the feel significantly.

3. **Font: General Sans vs system font?** General Sans is the storefront's brand font. System font is faster to render and more "native iOS." Recommendation: Use General Sans for headings, system font for body (hybrid approach).

4. **Runtime token fetch vs. hardcode?** Runtime means the app always matches the live storefront. Hardcode means faster boot but can drift. Recommendation: Fetch once per day, cache in MMKV, use hardcoded defaults as fallback.

---

## Timeline

| Day | Deliverable |
|-----|-------------|
| **1** | New `tailwind.config.js` with Foundry token structure. Automated find-replace for class names across all files. |
| **2** | Fix visual regressions from Day 1. Verify all 25 UI components render correctly. Update Button, Card, AppointmentCard, ProductCard. |
| **3** | Typography migration. Load General Sans font. Update all text-size classes. Verify 17pt minimum still holds. |
| **4** | Build `useDesignTokens` hook. Fetch from Foundry at startup. Inject into NativeWind runtime. Test with Foundry running. |
| **5** | Cleanup: remove dead tokens, update steering docs, run full test suite, visual regression pass on iPad simulator. |

---

## Validation Checklist

- [ ] All 33 tests still pass
- [ ] `pnpm typecheck` passes
- [ ] No hardcoded color hex values outside `tailwind.config.js`
- [ ] iPad simulator visual matches storefront brand
- [ ] 17pt minimum body text preserved
- [ ] 44pt touch targets preserved
- [ ] Privacy mode strips use correct brand/accent colors
- [ ] Verdict colors remain distinct and accessible
- [ ] Error/success/warning remain accessible (WCAG AA contrast)
- [ ] App works offline with cached tokens
- [ ] Skeleton shimmer uses correct Foundry tokens

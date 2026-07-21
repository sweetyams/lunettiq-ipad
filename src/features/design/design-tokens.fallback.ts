/**
 * design-tokens.fallback.ts — Static fallback tokens
 *
 * Used on first cold boot before GET /api/design/native responds,
 * and as the MMKV warm-start value while the fetch is in-flight.
 *
 * Values are kept in sync with:
 *   foundry/src/lib/design/tenant-brand.ts  → TENANT_BRAND.lunettiq
 *   foundry/src/lib/design/lunettiq-typography.ts → LUNETTIQ_TYPOGRAPHY
 *   foundry/src/lib/design/tenant-fonts.ts  → TENANT_FONTS.lunettiq
 *
 * When Foundry's brand changes, the runtime fetch will update MMKV.
 * This file is only the starting point — never the source of truth.
 */

import type { NativeDesignTokens } from './design-tokens.types';

export const FALLBACK_DESIGN_TOKENS: NativeDesignTokens = {
  meta: {
    tenant: 'lunettiq',
    version: 'fallback',
    fetchedAt: '1970-01-01T00:00:00Z', // Forces a fresh fetch on boot
  },

  fonts: {
    display: {
      family: 'General Sans',
      fallbacks: ['Inter', 'Helvetica Neue', 'sans-serif'],
      googleFontsUrl: null,
      weights: [400, 500, 600],
    },
    body: {
      family: 'General Sans',
      fallbacks: ['Inter', 'Helvetica Neue', 'sans-serif'],
      googleFontsUrl: null,
      weights: [400, 500],
    },
    mono: {
      family: 'ui-monospace',
      fallbacks: ['SF Mono', 'Menlo', 'monospace'],
      googleFontsUrl: null,
      weights: [400],
    },
  },

  colors: {
    // Backgrounds
    bgPage:           '#ffffff',
    bgSurface:        '#F8F6F7',
    bgSurfaceHover:   '#F8F6F7',
    bgMuted:          '#F8F6F7',
    bgInverse:        '#111111',
    bgElevated:       '#FFFFFF',
    bgOverlay:        'rgba(17, 17, 17, 0.5)',

    // Text
    textPrimary:      '#1D1F21',
    textSecondary:    'rgba(29, 31, 33, 0.65)',
    textTertiary:     'rgba(29, 31, 33, 0.55)',
    textMuted:        'rgba(29, 31, 33, 0.45)',
    textInverse:      '#FFFFFF',
    textLink:         '#1D1F21',
    textError:        '#B42318',

    // Borders
    border:           'rgba(17, 17, 17, 0.18)',
    borderHover:      'rgba(17,17,17,0.28)',
    borderStrong:     'rgba(17,17,17,0.24)',
    borderInverse:    'rgba(255,255,255,0.18)',
    focusRing:        'rgba(17,17,17,0.4)',

    // Brand
    brand:            '#1D1F21',
    brandHover:       '#1D1F21',
    brandText:        '#FFFFFF',
    brandSoft:        'rgba(17,17,17,0.08)',

    // Accent
    accent:           '#023891',
    accentHover:      '#022e78',
    accentText:       '#FFFFFF',

    // Feedback
    error:            '#B42318',
    errorSoft:        'rgba(180,35,24,0.08)',
    success:          '#067647',
    successSoft:      'rgba(6,118,71,0.08)',
    warning:          '#B54708',
    warningSoft:      'rgba(181,71,8,0.08)',
    info:             '#1D1F21',

    // Commerce
    sale:             '#B42318',
    soldOut:          'rgba(17,17,17,0.45)',
    limited:          '#7C6F64',

    // Skeleton
    skeletonBase:     '#F7F5F2',
    skeletonShimmer:  '#EFEEE9',
  },

  typeScale: [
    // Lunettiq's type system is intentionally uniform — differentiation via
    // spacing, transform, and layout rather than size hierarchy.
    // All tokens share: fontSize 14, lineHeight 20, fontWeight 500, letterSpacing 0.1px

    // Display (5)
    { name: 'display-xxl', category: 'display', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'display-xl',  category: 'display', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'display-lg',  category: 'display', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'display-md',  category: 'display', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'display-sm',  category: 'display', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },

    // Heading (5)
    { name: 'heading-xl',  category: 'heading', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'heading-lg',  category: 'heading', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'heading-md',  category: 'heading', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'heading-sm',  category: 'heading', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'heading-xs',  category: 'heading', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },

    // Body (5)
    { name: 'body-xl',     category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'body-lg',     category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'body-md',     category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'body-sm',     category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'body-xs',     category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },

    // Caption (4)
    { name: 'caption-lg',  category: 'caption', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'caption-md',  category: 'caption', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'caption-sm',  category: 'caption', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
    { name: 'caption-xs',  category: 'caption', fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },

    // Nav (storefront-specific extra token)
    { name: 'nav',         category: 'body',    fontFamily: 'display', fontSize: 14, lineHeight: 20, fontWeight: 500, letterSpacing: '0.1px' },
  ],

  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  radius: { sm: 6, md: 10, lg: 14, full: 9999 },
};

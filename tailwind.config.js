/**
 * Tailwind / NativeWind config — Lunettiq iPad
 *
 * COLOR RULE: Every color value here MUST match GET /api/design/native.
 * Token names mirror the API response keys, prefixed with 'color-' for NativeWind.
 *
 * Source of truth:
 *   GET https://lunettiq.bentspline.com/api/design/native
 *   (public, no auth required — same data served to storefront CSS)
 *
 * At runtime, DesignTokenProvider fetches the live token values at boot
 * and applies them via useDesignTokens(). This file is the static fallback
 * used by NativeWind for className resolution and the first render frame.
 *
 * Last synced: 2026-07-21 (version 9adbdbe8)
 *
 * DO NOT hardcode hex values in component code. Use className tokens only.
 * LINT: audit-design-drift.ts rejects bare hex/rgba in style props.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ─── Foundry storefront tokens — live from GET /api/design/native ────
        // Last synced: 2026-07-21 version 9adbdbe8
        // These are the fallback values when the runtime fetch hasn't completed.
        // The DesignTokenProvider applies live values at boot.
        //
        // Key structure matches NativeWind className usage:
        //   bg-bg-page       → colors.bg.page
        //   text-text-primary → colors.text.primary
        //   border-border     → colors.border.DEFAULT

        // Backgrounds → bg-bg-{key}
        bg: {
          page:           '#ffffff',
          surface:        '#F8F6F7',
          'surface-hover':'#F8F6F7',
          muted:          '#F8F6F7',
          inverse:        '#111111',
          elevated:       '#FFFFFF',
          overlay:        'rgba(17, 17, 17, 0.5)',
        },

        // Text → text-text-{key}
        text: {
          primary:        '#1D1F21',
          secondary:      'rgba(29, 31, 33, 0.65)',
          tertiary:       'rgba(29, 31, 33, 0.55)',
          muted:          'rgba(29, 31, 33, 0.45)',
          inverse:        '#FFFFFF',
          link:           '#1D1F21',
          error:          '#B42318',
        },

        // Borders → border-border, border-border-{key}
        border: {
          DEFAULT:        'rgba(17, 17, 17, 0.18)',
          hover:          'rgba(17,17,17,0.28)',
          strong:         'rgba(17,17,17,0.24)',
          inverse:        'rgba(255,255,255,0.18)',
        },

        // Focus ring → ring-focus-ring
        'focus-ring':     'rgba(17,17,17,0.4)',

        // Brand → bg-brand, text-brand-text, etc.
        brand: {
          DEFAULT:        '#1D1F21',
          hover:          '#1D1F21',
          text:           '#FFFFFF',
          soft:           'rgba(17,17,17,0.08)',
        },

        // Accent → bg-accent, text-accent-text
        accent: {
          DEFAULT:        '#023891',
          hover:          '#022e78',
          text:           '#FFFFFF',
        },

        // Feedback → text-error, bg-error, text-success, etc.
        error:            '#B42318',
        'error-soft':     'rgba(180,35,24,0.08)',
        success:          '#067647',
        'success-soft':   'rgba(6,118,71,0.08)',
        warning:          '#B54708',
        'warning-soft':   'rgba(181,71,8,0.08)',
        info:             '#1D1F21',

        // Commerce
        sale:             '#B42318',
        'sold-out':       'rgba(17,17,17,0.45)',
        limited:          '#7C6F64',

        // Skeleton → bg-skeleton-bg, bg-skeleton-shimmer
        skeleton: {
          bg:             '#F7F5F2',
          shimmer:        '#EFEEE9',
        },

        // ─── iPad-specific semantic tokens ────────────────────────────────────
        // Derived from the storefront tokens above. No new raw colors.

        // Verdicts → bg-verdict-loved, text-verdict-liked, etc.
        verdict: {
          loved:          '#067647',   // = success
          liked:          '#023891',   // = accent
          unsure:         '#B54708',   // = warning
          rejected:       'rgba(29, 31, 33, 0.45)', // = text-muted
        },

        // Privacy mode → bg-mode-staff, bg-mode-client
        mode: {
          staff:          '#023891',   // = accent
          client:         '#067647',   // = success
        },

        // Staff chrome → bg-chrome-bg, text-chrome-text, border-chrome-border
        chrome: {
          bg:             '#111111',   // = bg-inverse
          text:           '#FFFFFF',   // = text-inverse
          border:         'rgba(255,255,255,0.18)', // = border-inverse
        },

        // Legacy compat — some components use these directly
        warmGrey:         '#F8F6F7',   // = bg-muted (for migration)
      },

      // ─── Typography — from /api/design/native.typeScale ──────────────────
      // Lunettiq's design system is intentionally uniform: 14px/20px/500/0.1px
      // Differentiation is through spacing, transform, and layout — not size.
      //
      // iPad accessibility note: 14px is below the 17pt minimum for CLIENT-VISIBLE
      // screens. Apply text-[18px] overrides specifically on client-facing surfaces
      // (FIT-03, FIT-05, SES-03). Staff chrome at 14px is fine.
      fontSize: {
        'display-xxl':  ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'display-xl':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'display-lg':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'display-md':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'display-sm':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'heading-xl':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'heading-lg':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'heading-md':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'heading-sm':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'heading-xs':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-xl':      ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-lg':      ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-md':      ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-sm':      ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'body-xs':      ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'caption-lg':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'caption-md':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'caption-sm':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
        'caption-xs':   ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0.1px' }],
      },

      // ─── Font families — from /api/design/native.fonts ─────────────────
      fontFamily: {
        sans:    ['"General Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        display: ['"General Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        mono:    ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },

      // ─── Spacing — unchanged, matches Foundry section spacing scale ──────
      spacing: {
        xs:   '4px',
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        '2xl': '48px',
      },

      // ─── Radius — unchanged ───────────────────────────────────────────────
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

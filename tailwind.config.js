/**
 * Tailwind / NativeWind config — Lunettiq iPad
 *
 * SOURCE OF TRUTH: GET https://lunettiq.bentspline.com/api/design/native
 * (public, no auth required — same data served to storefront CSS)
 *
 * These are STATIC FALLBACK values used by NativeWind for className resolution
 * and the first render frame. At runtime, DesignTokenProvider fetches live values
 * from the API and applies them. If the API returns a different version hash,
 * the app re-applies the new values.
 *
 * Last synced: 2026-07-29 (API version 77f8561f)
 *
 * BRAND SEMANTICS (Lunettiq-specific — differs from typical convention):
 *   brand  = identity color (#023891 blue) — filter highlights, branding moments, active states
 *   accent = interactive dark (#1D1F21) — buttons, selected tabs, pressed states
 *   The primary CTA per screen uses `accent` (dark), NOT brand. Brand appears sparingly.
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
        // ─── Foundry storefront tokens — GET /api/design/native v77f8561f ──
        //
        // Key structure matches NativeWind className usage:
        //   bg-bg-page         → colors.bg.page
        //   text-text-primary   → colors.text.primary
        //   border-border       → colors.border.DEFAULT
        //   bg-brand            → colors.brand.DEFAULT
        //   bg-accent           → colors.accent.DEFAULT

        // Backgrounds → bg-bg-{key}
        bg: {
          page:            '#ffffff',
          surface:         '#F8F6F7',
          'surface-hover': '#F8F6F7',
          muted:           '#F8F6F7',
          inverse:         '#111111',
          elevated:        '#FFFFFF',
          overlay:         'rgba(17, 17, 17, 0.5)',
        },

        // Text → text-text-{key}
        text: {
          primary:   '#1D1F21',
          secondary: 'rgba(29, 31, 33, 0.65)',
          tertiary:  'rgba(29, 31, 33, 0.55)',
          muted:     'rgba(29, 31, 33, 0.45)',
          inverse:   '#FFFFFF',
          link:      '#1D1F21',
          error:     '#B42318',
        },

        // Borders → border-border, border-border-{key}
        border: {
          DEFAULT: 'rgba(17, 17, 17, 0.18)',
          hover:   'rgba(17, 17, 17, 0.28)',
          strong:  'rgba(17, 17, 17, 0.24)',
          inverse: 'rgba(255, 255, 255, 0.18)',
        },

        // Focus ring → ring-focus-ring
        'focus-ring': 'rgba(17, 17, 17, 0.4)',

        // Brand (Lunettiq blue — identity color, sparingly used)
        // → bg-brand, text-brand-text, bg-brand-soft
        brand: {
          DEFAULT: '#023891',
          hover:   '#022e78',
          text:    '#FFFFFF',
          soft:    'rgba(2, 56, 145, 0.08)',
        },

        // Accent (dark — primary interactive color: buttons, selected states)
        // → bg-accent, text-accent-text
        accent: {
          DEFAULT: '#1D1F21',
          hover:   '#1D1F21',
          text:    '#FFFFFF',
        },

        // Feedback → text-error, bg-error, bg-error-soft, etc.
        error:          '#B42318',
        'error-soft':   'rgba(180, 35, 24, 0.08)',
        success:        '#067647',
        'success-soft': 'rgba(6, 118, 71, 0.08)',
        warning:        '#B54708',
        'warning-soft': 'rgba(181, 71, 8, 0.08)',
        info:           '#023891',

        // Commerce
        sale:      '#B42318',
        'sold-out': 'rgba(17, 17, 17, 0.45)',
        limited:   '#7C6F64',

        // Skeleton → bg-skeleton-bg, bg-skeleton-shimmer
        skeleton: {
          bg:      '#F7F5F2',
          shimmer: '#EFEEE9',
        },

        // ─── iPad-specific semantic tokens ────────────────────────────────────
        // Derived from the Foundry storefront tokens above. No new raw colors.
        // These enable wireframe-specific UI concepts not in the storefront.

        // Verdicts (fitting session) → bg-verdict-loved, text-verdict-liked, etc.
        verdict: {
          loved:    '#067647',                  // = success
          liked:    '#023891',                  // = brand
          unsure:   '#B54708',                  // = warning
          rejected: 'rgba(29, 31, 33, 0.45)',   // = text-muted
        },

        // Privacy mode strips → bg-mode-staff, bg-mode-client
        mode: {
          staff:  '#023891',  // = brand (2pt strip)
          client: '#067647',  // = success (6pt strip + CLIENT VIEW)
        },

        // Staff chrome (dark panels) → bg-chrome-bg, text-chrome-text, border-chrome-border
        chrome: {
          bg:     '#111111',                    // = bg-inverse
          text:   '#FFFFFF',                    // = text-inverse
          border: 'rgba(255, 255, 255, 0.18)', // = border-inverse
        },
      },

      // ─── Typography — from /api/design/native.typeScale (v77f8561f) ──────
      //
      // Lunettiq's scale spans 10px–64px. The storefront uses a tighter range
      // (body 12–18px) but display sizes go up to 64px for hero moments.
      //
      // Font: General Sans (variable, 200–700). Body/captions use body family,
      // display/heading use display family — both resolve to General Sans.
      //
      // iPad note: body-lg (16px) is the default body text for staff UI.
      // Client-visible mode uses body-xl (18px) for accessibility (17pt min).
      //
      // Letter-spacing values are in em — NativeWind converts to pts at render.
      // Weight 400 is the system default; 500+ used only on interactive controls.
      fontSize: {
        // Display — large titles, hero content
        'display-xxl': ['64px', { lineHeight: '68px', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-xl':  ['48px', { lineHeight: '52px', fontWeight: '400', letterSpacing: '-0.01em' }],
        'display-lg':  ['36px', { lineHeight: '40px', fontWeight: '400' }],
        'display-md':  ['28px', { lineHeight: '32px', fontWeight: '400' }],
        'display-sm':  ['22px', { lineHeight: '28px', fontWeight: '400' }],

        // Heading — section titles, panel labels
        'heading-xl':  ['20px', { lineHeight: '24px', fontWeight: '400' }],
        'heading-lg':  ['18px', { lineHeight: '23px', fontWeight: '400', letterSpacing: '0.04em' }],
        'heading-md':  ['16px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.02em' }],
        'heading-sm':  ['16px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.02em' }],
        'heading-xs':  ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.02em' }],

        // Body — readable content
        'body-xl':     ['18px', { lineHeight: '26px', fontWeight: '400', letterSpacing: '0.04em' }],
        'body-lg':     ['16px', { lineHeight: '23px', fontWeight: '400', letterSpacing: '0.04em' }],
        'body-md':     ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.02em' }],
        'body-sm':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-xs':     ['12px', { lineHeight: '20px', fontWeight: '400' }],

        // Price — mono, tabular numerals
        'price':       ['14px', { lineHeight: '20px', fontWeight: '400', letterSpacing: '0.04em' }],

        // Caption — small labels, metadata
        'caption-lg':  ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-md':  ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'caption-sm':  ['11px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0.02em' }],
        'caption-xs':  ['10px', { lineHeight: '14px', fontWeight: '400', letterSpacing: '0.02em' }],
      },

      // ─── Font families — from /api/design/native.fonts ─────────────────
      // General Sans is a variable-weight font (200–700) from Fontshare.
      // One .ttf file covers all weights. Downloaded at boot, cached in MMKV.
      fontFamily: {
        sans:    ['"General Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        display: ['"General Sans"', 'Arial', 'Helvetica', 'sans-serif'],
        mono:    ['"DM Sans"', 'SF Mono', 'Menlo', 'monospace'],
      },

      // ─── Spacing — from /api/design/native.spacing ───────────────────────
      spacing: {
        xs:   '4px',
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        '2xl': '48px',
      },

      // ─── Radius — from /api/design/native.radius ─────────────────────────
      // NOTE: Lunettiq storefront is sharp-edged — buttons and cards often use
      // radius 0. These tokens exist for elements that need rounding (pills,
      // avatars, specific interactive states). Don't apply radius-lg to buttons.
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

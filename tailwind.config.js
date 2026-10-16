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
 * PHASE D (2026-10-16): staff chrome now follows Found UI (the Builder's system).
 * Lunettiq storefront values remain for `brand` and client-facing content.
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

        // ─── Found UI (Builder) chrome — foundry/src/app/globals.css, OKLCH → hex ──
        // White first: pages, cards and panels are white; depth comes from hairlines
        // and elevation, never grey fills. `muted`/`subtle` are for accents only
        // (selected segment, pressed row, input well). See docs/v2/02-design-parity.md.

        // Backgrounds → bg-bg-{key}
        bg: {
          page:            '#FFFFFF',
          surface:         '#FFFFFF',               // cards/panels: white + border-border
          'surface-hover': '#F7F7F7',
          muted:           '#F7F7F7',               // accents only
          subtle:          '#F7F7F7',               // accents only (alias)
          inverse:         '#171717',
          elevated:        '#FFFFFF',
          overlay:         'rgba(10, 10, 10, 0.4)',
        },

        // Text → text-text-{key}
        text: {
          primary:   '#0A0A0A',   // --foreground
          secondary: '#52525B',
          tertiary:  '#71717A',   // --muted-foreground
          muted:     '#71717A',
          dim:       'rgba(113, 113, 122, 0.6)', // --dim
          inverse:   '#FFFFFF',
          link:      '#0A0A0A',
          error:     '#E7000B',
        },

        // Borders → border-border, border-border-{key}
        border: {
          DEFAULT: '#E4E4E7',     // --border
          hover:   '#D4D4D8',
          strong:  '#D4D4D8',
          inverse: 'rgba(255, 255, 255, 0.18)',
        },

        // Focus ring → ring-focus-ring
        'focus-ring': '#A1A1AA',  // --ring

        // Brand (Lunettiq blue — identity moments only, from the storefront)
        brand: {
          DEFAULT: '#023891',
          hover:   '#022e78',
          text:    '#FFFFFF',
          soft:    'rgba(2, 56, 145, 0.08)',
        },

        // Accent = Found UI --primary: the one primary action per view
        accent: {
          DEFAULT: '#171717',
          hover:   '#262626',
          text:    '#FFFFFF',
        },

        // Status (Found UI): text colour, soft background, ring
        error:          '#E7000B',
        'error-soft':   'rgba(231, 0, 11, 0.08)',
        'error-ring':   'rgba(231, 0, 11, 0.2)',
        success:        '#008053',
        'success-soft': '#E6F7EE',
        'success-ring': '#B1E1C9',
        warning:        '#C76A18',
        'warning-soft': '#FCF3E2',
        'warning-ring': '#EDD5A3',
        info:           '#0077BA',
        'info-soft':    '#E7F5FF',
        'info-ring':    '#B2DAF9',

        // Commerce
        sale:      '#E7000B',
        'sold-out': '#71717A',
        limited:   '#7C6F64',

        // Skeleton → bg-skeleton-bg, bg-skeleton-shimmer
        skeleton: {
          bg:      '#F4F4F5',
          shimmer: '#E4E4E7',
        },

        // ─── Legacy names (old navy/green palette) ─────────────────────────────
        // These were used in ~79 places but never existed, so they rendered
        // nothing. Aliased to the nearest Found UI token until each screen is
        // migrated in Phase D; audit:design reports any remaining use.
        navy:     '#171717',
        green:    '#008053',
        blue:     '#0077BA',
        warmGrey: '#E4E4E7',
        offWhite: '#FFFFFF',
        charcoal: '#0A0A0A',
        muted:    '#F7F7F7',

        // ─── iPad-specific semantic tokens ────────────────────────────────────
        // Derived from the Foundry storefront tokens above. No new raw colors.
        // These enable wireframe-specific UI concepts not in the storefront.

        // Verdicts (fitting session) → bg-verdict-loved, text-verdict-liked, etc.
        verdict: {
          loved:    '#008053',                  // = success
          liked:    '#023891',                  // = brand
          unsure:   '#C76A18',                  // = warning
          rejected: '#71717A',                  // = text-muted
        },

        // Privacy mode strips → bg-mode-staff, bg-mode-client
        mode: {
          staff:  '#023891',  // = brand (2pt strip)
          client: '#008053',  // = success (6pt strip + CLIENT VIEW)
        },

        // Staff chrome (dark panels) → bg-chrome-bg, text-chrome-text, border-chrome-border
        chrome: {
          bg:     '#171717',                    // = bg-inverse
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
        // Found UI hierarchy (title / heading / section / body / caption), one step
        // larger for touch and for clients without glasses. Floor: 14px (13px only
        // for uppercase micro-labels). Titles are medium weight, like the Builder.
        'display-xxl': ['56px', { lineHeight: '60px', fontWeight: '500', letterSpacing: '-0.02em' }],
        'display-xl':  ['40px', { lineHeight: '46px', fontWeight: '500', letterSpacing: '-0.02em' }],
        'display-lg':  ['30px', { lineHeight: '36px', fontWeight: '500', letterSpacing: '-0.01em' }],  // page title
        'display-md':  ['26px', { lineHeight: '32px', fontWeight: '500', letterSpacing: '-0.01em' }],
        'display-sm':  ['22px', { lineHeight: '28px', fontWeight: '500' }],

        'heading-xl':  ['20px', { lineHeight: '28px', fontWeight: '500' }],                          // panel title
        'heading-lg':  ['18px', { lineHeight: '26px', fontWeight: '500' }],                          // row title
        'heading-md':  ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'heading-sm':  ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'heading-xs':  ['14px', { lineHeight: '20px', fontWeight: '500' }],

        'body-xl':     ['18px', { lineHeight: '28px', fontWeight: '400' }],  // client-visible
        'body-lg':     ['16px', { lineHeight: '24px', fontWeight: '400' }],  // staff body
        'body-md':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-xs':     ['14px', { lineHeight: '20px', fontWeight: '400' }],

        'price':       ['16px', { lineHeight: '24px', fontWeight: '500' }],

        'caption-lg':  ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-md':  ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-sm':  ['13px', { lineHeight: '18px', fontWeight: '500', letterSpacing: '0.06em' }],  // micro-label
        'caption-xs':  ['13px', { lineHeight: '18px', fontWeight: '500', letterSpacing: '0.06em' }],
      },

      // ─── Font families — from /api/design/native.fonts ─────────────────
      // General Sans is a variable-weight font (200–700) from Fontshare.
      // One .ttf file covers all weights. Downloaded at boot, cached in MMKV.
      // The Builder uses Inter with the Apple system font as its fallback. On iOS
      // the system font (SF Pro, which Inter is modelled on) gives real weights
      // and Dynamic Type; "General Sans" was configured but never loaded.
      fontFamily: {
        sans:    ['System'],
        display: ['System'],
        mono:    ['System'],  // numbers: Builder uses tabular figures, not a monospace face
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
      // Found UI: 8px controls, 10px cards/panels (--radius 0.625rem), pills full.
      borderRadius: {
        sm:   '6px',
        md:   '8px',
        lg:   '10px',
        xl:   '12px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};

/**
 * Tailwind / NativeWind config — Lunettiq iPad
 *
 * COLOR RULE: Every color value here is the exact value from Foundry's
 * TENANT_BRAND.lunettiq (src/lib/design/tenant-brand.ts).
 * Token names mirror the --color-* CSS var names (drop the -- prefix, camelCase the dash).
 *
 * Source of truth for each token:
 *   Colors   → foundry/src/lib/design/tenant-brand.ts   (TENANT_BRAND.lunettiq)
 *   Type     → foundry/src/lib/design/lunettiq-typography.ts  (LUNETTIQ_TYPOGRAPHY)
 *   Font     → foundry/src/lib/design/tenant-fonts.ts   (TENANT_FONTS.lunettiq)
 *
 * DO NOT hardcode hex values in component code. Use className tokens only.
 * LINT: no-hardcoded-colors (see .eslintrc.js) rejects bare hex/rgba in style={}.
 *
 * To update: sync the values below with the three Foundry source files above.
 * Runtime fetch (V2): GET /api/design/full with Bearer token at app boot.
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
        // ─── Foundry storefront tokens — TENANT_BRAND.lunettiq ───────────────
        // Each key mirrors --color-{key} from the Foundry CSS var.
        // Values are kept in sync with tenant-brand.ts.

        // Backgrounds (5 core)
        'color-bg-page':           '#FFFFFF',
        'color-bg-surface':        '#FFFFFF',
        'color-bg-surface-hover':  '#FAFAFA',
        'color-bg-muted':          '#F5F5F5',
        'color-bg-inverse':        '#0A0A0A',

        // Text (4 core)
        'color-text-primary':      '#171717',
        'color-text-secondary':    '#404040',
        'color-text-muted':        '#737373',
        'color-text-inverse':      '#FAFAFA',

        // Borders (3 core)
        'color-border':            '#D4D4D4',
        'color-border-inverse':    'rgba(255,255,255,0.18)',
        'color-focus-ring':        '#0010DF',

        // Brand (3 core) — electric blue, Lunettiq identity
        'color-brand':             '#000EC7',
        'color-brand-hover':       '#000CA3',
        'color-brand-text':        '#FFFFFF',

        // Accent (3 core) — dark neutral
        'color-accent':            '#525252',
        'color-accent-hover':      '#404040',
        'color-accent-text':       '#FFFFFF',

        // Feedback (4 core)
        'color-sale':              '#DC2626',
        'color-error':             '#DC2626',
        'color-success':           '#16A34A',
        'color-warning':           '#CA8A04',

        // Skeleton (2 core — derived from bg tokens)
        'color-skeleton-bg':       '#F5F5F5',   // = color-bg-muted
        'color-skeleton-shimmer':  '#FAFAFA',   // = color-bg-surface-hover

        // ─── iPad-specific semantic tokens ────────────────────────────────────
        // These have no storefront equivalent. Defined here and nowhere else.
        // All values are derived from the storefront token set above.

        // Verdicts (fitting session) — mapped to nearest storefront semantic color
        'verdict-loved':           '#16A34A',   // = color-success
        'verdict-liked':           '#000EC7',   // = color-brand (info blue)
        'verdict-unsure':          '#CA8A04',   // = color-warning
        'verdict-rejected':        '#737373',   // = color-text-muted (neutral, not error)

        // Privacy mode indicators
        'mode-staff':              '#000EC7',   // = color-brand — 2pt strip
        'mode-client':             '#16A34A',   // = color-success — 6pt strip + CLIENT VIEW label

        // Staff UI chrome (data-dense panels — derived from bg-inverse)
        'chrome-bg':               '#0A0A0A',   // = color-bg-inverse
        'chrome-text':             '#FAFAFA',   // = color-text-inverse
        'chrome-border':           'rgba(255,255,255,0.18)', // = color-border-inverse

        // Overlay / scrim
        'color-overlay':           'rgba(10,10,10,0.5)', // derived from color-bg-inverse
      },

      // ─── Typography — LUNETTIQ_TYPOGRAPHY (lunettiq-typography.ts) ───────
      // Desktop values throughout — iPad never renders at mobile breakpoint.
      // font-weight baked in per token; override per-component with font-{weight}.
      fontSize: {
        // Display (5) — Roboto 400, tight negative tracking
        'display-xxl':  ['90px', { lineHeight: '90px',  fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-xl':   ['72px', { lineHeight: '76px',  fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-lg':   ['48px', { lineHeight: '60px',  fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-md':   ['36px', { lineHeight: '44px',  fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-sm':   ['30px', { lineHeight: '38px',  fontWeight: '400' }],

        // Heading (5) — Roboto 400, readable weight
        'heading-xl':   ['28px', { lineHeight: '34px',  fontWeight: '400' }],
        'heading-lg':   ['24px', { lineHeight: '32px',  fontWeight: '400' }],
        'heading-md':   ['20px', { lineHeight: '30px',  fontWeight: '400' }],
        'heading-sm':   ['18px', { lineHeight: '28px',  fontWeight: '400' }],
        'heading-xs':   ['16px', { lineHeight: '24px',  fontWeight: '400' }],

        // Body (5) — minimum 17px for accessibility (client may not have glasses)
        'body-xl':      ['20px', { lineHeight: '30px',  fontWeight: '400' }],
        'body-lg':      ['18px', { lineHeight: '28px',  fontWeight: '400' }],  // ← 17pt min met
        'body-md':      ['16px', { lineHeight: '24px',  fontWeight: '400' }],  // staff-only UI only
        'body-sm':      ['14px', { lineHeight: '20px',  fontWeight: '400' }],  // metadata only
        'body-xs':      ['12px', { lineHeight: '18px',  fontWeight: '400' }],  // timestamps/badges

        // Caption (4) — last two use mono font stack for tabular data
        'caption-lg':   ['14px', { lineHeight: '20px',  fontWeight: '400' }],
        'caption-md':   ['12px', { lineHeight: '18px',  fontWeight: '400' }],
        'caption-sm':   ['11px', { lineHeight: '16px',  fontWeight: '400' }],  // font-mono
        'caption-xs':   ['10px', { lineHeight: '14px',  fontWeight: '400' }],  // font-mono
      },

      // ─── Font families — TENANT_FONTS.lunettiq (tenant-fonts.ts) ─────────
      fontFamily: {
        // Both display and body → Roboto (Google Fonts, loaded at app boot)
        sans:    ['"Roboto"', '"Inter"', '"Helvetica Neue"', 'sans-serif'],
        display: ['"Roboto"', '"Inter"', '"Helvetica Neue"', 'sans-serif'],
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

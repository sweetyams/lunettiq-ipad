/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // === Foundry Semantic Tokens (Lunettiq tenant) ===
        // Source: /api/design/css — [data-storefront="lunettiq"]

        // Brand
        brand: {
          DEFAULT: '#1D1F21',
          hover: '#1D1F21',
          text: '#FFFFFF',
          soft: 'rgba(17,17,17,0.08)',
        },

        // Accent (single primary action per screen)
        accent: {
          DEFAULT: '#023891',
          hover: '#022e78',
          text: '#FFFFFF',
        },

        // Backgrounds
        bg: {
          page: '#FFFFFF',
          surface: '#F8F6F7',
          'surface-hover': '#F8F6F7',
          muted: '#F8F6F7',
          inverse: '#111111',
          elevated: '#FFFFFF',
          overlay: 'rgba(17,17,17,0.5)',
        },

        // Text
        text: {
          primary: '#1D1F21',
          secondary: 'rgba(29,31,33,0.65)',
          tertiary: 'rgba(29,31,33,0.55)',
          muted: 'rgba(29,31,33,0.45)',
          inverse: '#FFFFFF',
          link: '#1D1F21',
          error: '#B42318',
        },

        // Borders
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

        // App-specific (verdicts — no Foundry equiv)
        verdict: {
          loved: '#067647',
          liked: '#023891',
          unsure: '#B54708',
          rejected: 'rgba(29,31,33,0.45)',
        },

        // Skeleton loading
        skeleton: {
          bg: '#F7F5F2',
          shimmer: '#EFEEE9',
        },

        // Focus
        'focus-ring': 'rgba(17,17,17,0.4)',
      },

      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },

      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        full: '9999px',
      },

      fontSize: {
        // Foundry typography scale (desktop values — iPad is always "desktop")
        'display-xxl': ['90px', { lineHeight: '90px', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-xl': ['72px', { lineHeight: '76px', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-lg': ['48px', { lineHeight: '60px', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-md': ['36px', { lineHeight: '44px', fontWeight: '400', letterSpacing: '-0.02em' }],
        'display-sm': ['30px', { lineHeight: '38px', fontWeight: '400' }],
        'heading-xl': ['28px', { lineHeight: '34px', fontWeight: '400' }],
        'heading-lg': ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'heading-md': ['20px', { lineHeight: '30px', fontWeight: '400' }],
        'heading-sm': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'heading-xs': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-xl': ['20px', { lineHeight: '30px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-xs': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'caption-lg': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-md': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'caption-sm': ['11px', { lineHeight: '16px', fontWeight: '400' }],
        'caption-xs': ['10px', { lineHeight: '14px', fontWeight: '400' }],

        // Legacy aliases (map old names to Foundry scale for gradual migration)
        displayLg: ['30px', { lineHeight: '38px', fontWeight: '600' }],   // → display-sm
        displayMd: ['28px', { lineHeight: '34px', fontWeight: '600' }],   // → heading-xl
        headline: ['24px', { lineHeight: '32px', fontWeight: '500' }],    // → heading-lg
        body: ['18px', { lineHeight: '28px', fontWeight: '400' }],        // → body-lg (≥17pt min)
        bodyStrong: ['18px', { lineHeight: '28px', fontWeight: '500' }],  // → body-lg + font-medium
        caption: ['14px', { lineHeight: '20px', fontWeight: '400' }],     // → body-sm
        captionStrong: ['14px', { lineHeight: '20px', fontWeight: '500' }], // → body-sm + font-medium
      },

      fontFamily: {
        sans: ['"General Sans"', '"General Sans Fallback"', '-apple-system', 'system-ui', 'sans-serif'],
        display: ['"General Sans"', '"General Sans Fallback"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

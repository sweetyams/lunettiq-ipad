/**
 * NativeDesignTokens — the complete contract for GET /api/design/native
 *
 * This is a purpose-built shape for native app consumption.
 * - No CSS vars (no var(--...) references — all values are pre-resolved concrete hex/rgba)
 * - No desktop/mobile split — iPad always renders at desktop scale
 * - No DB internals (no layer, sortOrder, core fields)
 * - camelCase keys throughout — no CSS kebab-case
 *
 * The iPad fetches this once at cold boot (before Clerk login), caches in MMKV
 * keyed by meta.version. If the version matches what's cached, the cached values
 * are used without re-applying. Brand changes in Foundry propagate on next boot.
 */

// ─── Meta ────────────────────────────────────────────────────────────────────

export interface NativeDesignMeta {
  /** Tenant slug, e.g. "lunettiq" */
  tenant: string;
  /** 8-char hash of all token values. Cache key in MMKV: design:tokens:v{version} */
  version: string;
  /** ISO 8601 — when Foundry generated this response */
  fetchedAt: string;
}

// ─── Fonts ───────────────────────────────────────────────────────────────────

export interface NativeFontStack {
  /** Primary font family name, e.g. "General Sans" */
  family: string;
  /** Fallback chain if primary isn't loaded, e.g. ["Inter", "Helvetica Neue", "sans-serif"] */
  fallbacks: string[];
  /**
   * Full Google Fonts URL to preload at boot, or null if self-hosted / system font.
   * e.g. "https://fonts.googleapis.com/css2?family=General+Sans:wght@400;500;600"
   */
  googleFontsUrl: string | null;
  /** Font weights to load — only request what's needed */
  weights: number[];
}

export interface NativeDesignFonts {
  display: NativeFontStack;
  body: NativeFontStack;
  mono: NativeFontStack;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export interface NativeDesignColors {
  // Backgrounds (7)
  bgPage: string;           // Screen root background
  bgSurface: string;        // Cards, modals, panels
  bgSurfaceHover: string;   // Pressed/hovered surface state
  bgMuted: string;          // Secondary surfaces, disabled fills
  bgInverse: string;        // Dark panels, staff chrome headers
  bgElevated: string;       // Sheets floating above content
  bgOverlay: string;        // Modal scrim, privacy overlay (rgba)

  // Text (7)
  textPrimary: string;      // All primary content
  textSecondary: string;    // Supporting labels, sub-headings
  textTertiary: string;     // Lighter supporting text
  textMuted: string;        // Timestamps, placeholders, metadata
  textInverse: string;      // Text on dark/inverse surfaces
  textLink: string;         // Inline links
  textError: string;        // Inline error text

  // Borders (5)
  border: string;           // Card outlines, input borders, dividers
  borderHover: string;      // Border on focused/hovered element
  borderStrong: string;     // High-emphasis borders
  borderInverse: string;    // Borders on dark surfaces (rgba)
  focusRing: string;        // Keyboard/VoiceOver focus indicator

  // Brand — primary identity color (3 + 1 soft)
  brand: string;            // Primary action, active states, mode-staff strip
  brandHover: string;       // Pressed brand elements
  brandText: string;        // Text on brand-colored surfaces
  brandSoft: string;        // Tinted bg for brand-adjacent surfaces (rgba)

  // Accent — secondary neutral action (3)
  accent: string;           // Secondary buttons, ghost fills
  accentHover: string;      // Pressed accent
  accentText: string;       // Text on accent surfaces

  // Feedback (6 — color + soft variant for inline backgrounds)
  error: string;
  errorSoft: string;        // Toast bg, inline error bg (rgba)
  success: string;          // Also used for mode-client strip
  successSoft: string;      // Inline success bg (rgba)
  warning: string;          // Offline indicator, low stock
  warningSoft: string;      // Offline banner bg (rgba)
  info: string;             // Informational states (equals brand for Lunettiq)

  // Commerce — shown to clients on product screens (3)
  sale: string;             // Sale price label
  soldOut: string;          // Out-of-stock state
  limited: string;          // Low stock indicator

  // Skeleton / loading (2)
  skeletonBase: string;     // Base skeleton color
  skeletonShimmer: string;  // Shimmer pass color
}

// ─── Typography ──────────────────────────────────────────────────────────────

export type TypeCategory = 'display' | 'heading' | 'body' | 'caption';
export type FontRole = 'display' | 'body' | 'mono';

export interface NativeTypeToken {
  /** Token name matching tailwind.config.js, e.g. "body-lg" */
  name: string;
  category: TypeCategory;
  /** Resolved via NativeDesignFonts — use fonts[fontFamily].family */
  fontFamily: FontRole;
  /** Integer px — already at iPad/desktop scale, no breakpoint logic needed */
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  /** Only present when non-zero, e.g. "-0.02em" */
  letterSpacing?: string;
  /** Only present when set */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
}

// ─── Spacing & Radius ────────────────────────────────────────────────────────

export interface NativeDesignSpacing {
  xs: number;    // 4
  sm: number;    // 8
  md: number;    // 16
  lg: number;    // 24
  xl: number;    // 32
  xxl: number;   // 48
}

export interface NativeDesignRadius {
  sm: number;    // 6
  md: number;    // 10
  lg: number;    // 14
  full: number;  // 9999
}

// ─── Root type ───────────────────────────────────────────────────────────────

export interface NativeDesignTokens {
  meta: NativeDesignMeta;
  fonts: NativeDesignFonts;
  colors: NativeDesignColors;
  typeScale: NativeTypeToken[];
  spacing: NativeDesignSpacing;
  radius: NativeDesignRadius;
}

/**
 * useDesignTokens — typed access to the live Lunettiq brand token map.
 *
 * Usage:
 *
 *   // Full token object
 *   const { colors, typeScale, fonts, spacing, radius } = useDesignTokens();
 *
 *   // Single color value (for dynamic opacity or style props where className isn't possible)
 *   const { colors } = useDesignTokens();
 *   <View style={{ backgroundColor: colors.brand, opacity: isActive ? 1 : 0.4 }} />
 *
 *   // Type token by name
 *   const { getTypeToken } = useDesignTokens();
 *   const bodyLg = getTypeToken('body-lg'); // { fontSize: 18, lineHeight: 28, ... }
 *
 * IMPORTANT: For all static layout use cases, prefer NativeWind className tokens
 * (bg-color-brand, text-color-text-primary, etc.). Use this hook only when you
 * need a runtime value — dynamic opacity, JS animations, chart colors, etc.
 *
 * The ESLint rule no-hardcoded-colors will catch any bare hex values in style props.
 * Using this hook's values is the correct escape hatch.
 */
import { useMemo } from 'react';
import { useDesignTokenContext } from './DesignTokenProvider';
import type { NativeDesignTokens, NativeDesignColors, NativeTypeToken } from './design-tokens.types';

export interface UseDesignTokensResult {
  /** Full token object */
  tokens: NativeDesignTokens;

  /** Flat color map — use for style props only, prefer className for static layout */
  colors: NativeDesignColors;

  /**
   * iPad-derived semantic colors — computed from the live token set.
   * These don't exist in the storefront token set but are derived from it.
   */
  semantic: {
    // Verdicts — fitting session
    verdictLoved: string;
    verdictLiked: string;
    verdictUnsure: string;
    verdictRejected: string;

    // Privacy mode strips
    modeStaff: string;
    modeClient: string;

    // Staff chrome (dark panels)
    chromeBg: string;
    chromeText: string;
    chromeBorder: string;
  };

  /**
   * Look up a type token by name, e.g. getTypeToken('body-lg').
   * Returns undefined if the name isn't in the scale.
   */
  getTypeToken: (name: string) => NativeTypeToken | undefined;

  /**
   * Resolve a fontFamily role ('display' | 'body' | 'mono') to the full
   * React Native fontFamily string, e.g. '"General Sans"'.
   */
  getFontFamily: (role: 'display' | 'body' | 'mono') => string;

  /** True until the first network fetch completes */
  isLoading: boolean;
  /** Non-null if the last fetch failed — stale/fallback tokens are still in use */
  error: string | null;
  /** Force re-fetch — call after settings change */
  refresh: () => void;
}

export function useDesignTokens(): UseDesignTokensResult {
  const { tokens, isLoading, error, refresh } = useDesignTokenContext();

  const semantic = useMemo(() => ({
    // Verdicts — mapped to nearest storefront semantic
    verdictLoved:    tokens.colors.success,       // #16A34A
    verdictLiked:    tokens.colors.brand,          // #000EC7
    verdictUnsure:   tokens.colors.warning,        // #CA8A04
    verdictRejected: tokens.colors.textMuted,      // #737373

    // Privacy mode strips
    modeStaff:  tokens.colors.brand,               // 2pt strip — brand color
    modeClient: tokens.colors.success,             // 6pt strip + CLIENT VIEW

    // Staff chrome (dark panel surfaces)
    chromeBg:     tokens.colors.bgInverse,         // #0A0A0A
    chromeText:   tokens.colors.textInverse,       // #FAFAFA
    chromeBorder: tokens.colors.borderInverse,     // rgba(255,255,255,0.18)
  }), [tokens]);

  const typeMap = useMemo(
    () => new Map(tokens.typeScale.map(t => [t.name, t])),
    [tokens.typeScale]
  );

  const getTypeToken = (name: string): NativeTypeToken | undefined =>
    typeMap.get(name);

  const getFontFamily = (role: 'display' | 'body' | 'mono'): string => {
    const stack = tokens.fonts[role];
    return [stack.family, ...stack.fallbacks].map(f =>
      f.includes(' ') ? `"${f}"` : f
    ).join(', ');
  };

  return {
    tokens,
    colors: tokens.colors,
    semantic,
    getTypeToken,
    getFontFamily,
    isLoading,
    error,
    refresh,
  };
}

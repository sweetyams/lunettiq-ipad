import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions, type KeyboardEvent } from 'react-native';

/**
 * Screen size classes for the iPads we support (points):
 *   compact  < 900   — 11" portrait (834), iPad mini
 *   regular  < 1200  — 13" portrait (1032), 11" landscape (1194)
 *   wide     ≥ 1200  — 13" landscape (1376)
 * Layouts should key off these, never off fixed 13"-landscape pixel widths.
 */
export type SizeClass = 'compact' | 'regular' | 'wide';

export function sizeClassFor(width: number): SizeClass {
  if (width < 900) return 'compact';
  if (width < 1200) return 'regular';
  return 'wide';
}

export interface Layout {
  width: number;
  height: number;
  isPortrait: boolean;
  size: SizeClass;
  /** Room for a list column beside a detail pane. */
  twoPane: boolean;
  /** Width of the list column in a two-pane layout. */
  listWidth: number;
}

export function layoutFor(width: number, height: number): Layout {
  const size = sizeClassFor(width);
  return {
    width,
    height,
    isPortrait: height > width,
    size,
    twoPane: size !== 'compact',
    listWidth: size === 'wide' ? 440 : size === 'regular' ? 360 : width,
  };
}

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  return layoutFor(width, height);
}

/**
 * How much of the window the software keyboard covers (0 when hidden, floating or
 * undocked — iPad keyboards don't always sit at the bottom). Uses the will* events on
 * iOS so layouts move with the keyboard animation, not after it.
 */
export function useKeyboard(): { height: number; visible: boolean } {
  const { height: windowHeight } = useWindowDimensions();
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const onChange = (e: KeyboardEvent) => {
      const { screenY, height } = e.endCoordinates;
      // Docked keyboards end at the bottom of the screen; floating/undocked ones don't.
      const docked = Math.abs(screenY + height - windowHeight) < 2;
      setOverlap(docked ? Math.max(0, windowHeight - screenY) : 0);
    };
    const onHide = () => setOverlap(0);
    const subs = Platform.OS === 'ios'
      ? [Keyboard.addListener('keyboardWillChangeFrame', onChange), Keyboard.addListener('keyboardWillHide', onHide)]
      : [Keyboard.addListener('keyboardDidShow', onChange), Keyboard.addListener('keyboardDidHide', onHide)];
    return () => subs.forEach((s) => s.remove());
  }, [windowHeight]);

  return { height: overlap, visible: overlap > 0 };
}

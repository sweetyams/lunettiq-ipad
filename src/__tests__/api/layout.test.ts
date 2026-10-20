import { describe, it, expect } from 'vitest';
import { layoutFor, sizeClassFor } from '@/src/ui/layout';

describe('layout size classes', () => {
  it.each([
    ['11" portrait', 834, 1194, 'compact', false],
    ['11" landscape', 1194, 834, 'regular', true],
    ['13" portrait', 1032, 1376, 'regular', true],
    ['13" landscape', 1376, 1032, 'wide', true],
    ['iPad mini portrait', 744, 1133, 'compact', false],
  ] as const)('%s → %s', (_label, w, h, size, twoPane) => {
    const l = layoutFor(w, h);
    expect(l.size).toBe(size);
    expect(l.twoPane).toBe(twoPane);
    expect(l.isPortrait).toBe(h > w);
  });

  it('list column narrows before it disappears', () => {
    expect(layoutFor(1376, 1032).listWidth).toBe(440);
    expect(layoutFor(1194, 834).listWidth).toBe(360);
    expect(layoutFor(834, 1194).listWidth).toBe(834);
    expect(sizeClassFor(899)).toBe('compact');
    expect(sizeClassFor(1200)).toBe('wide');
  });
});

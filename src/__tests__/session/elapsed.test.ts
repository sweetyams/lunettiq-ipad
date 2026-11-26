import { describe, it, expect, vi } from 'vitest';

vi.mock('react', () => ({ useEffect: () => undefined, useState: (v: unknown) => [v, () => undefined] }));

import { formatVisitElapsed, isStaleVisit } from '@/src/features/session/elapsed';

const start = new Date(2026, 10, 24, 16, 12).getTime(); // Tue 24 Nov, 4:12 p.m.

describe('visit clock', () => {
  it('counts minutes and hours during a visit', () => {
    expect(formatVisitElapsed(start, start + 65_000)).toBe('1:05');
    expect(formatVisitElapsed(start, start + 3_729_000)).toBe('1:02:09');
  });
  it('says when a forgotten visit was opened instead of counting hundreds of hours', () => {
    const later = start + 869 * 3_600_000;
    expect(formatVisitElapsed(start, later)).toMatch(/^open since Tue, 4:12/);
    expect(isStaleVisit(start, later)).toBe(true);
    expect(isStaleVisit(start, start + 3_600_000)).toBe(false);
  });
  it('shows 0:00 with no visit', () => {
    expect(formatVisitElapsed(null, start)).toBe('0:00');
  });
});

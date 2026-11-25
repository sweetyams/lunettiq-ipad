import { describe, it, expect } from 'vitest';
import { gridColumns } from '@/src/ui/productGrid';

describe('gridColumns', () => {
  it('uses 4 across on wide screens and 3 on narrower ones', () => {
    expect(gridColumns(1376 - 48)).toBe(4); // 13" landscape, Frames
    expect(gridColumns(1194 - 48)).toBe(4); // 11" landscape, Frames
    expect(gridColumns(1032 - 48)).toBe(4); // 13" portrait, Frames
    expect(gridColumns(834 - 48)).toBe(3); // 11" portrait, Frames
    expect(gridColumns(1376 - 400 - 48)).toBe(4); // 13" landscape, visit catalogue beside the tray
    expect(gridColumns(1032 - 340 - 48)).toBe(3); // 13" portrait, visit catalogue beside the tray
    expect(gridColumns(834 - 300 - 48)).toBe(3); // 11" portrait, visit catalogue
  });
  it('falls back to 2 only when very narrow', () => {
    expect(gridColumns(400)).toBe(2);
  });
});

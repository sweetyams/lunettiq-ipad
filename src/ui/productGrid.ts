/**
 * Columns for a product grid of `available` points: 4 when wide, 3 normally,
 * 2 only when very narrow, so square cards stay roughly 160–330pt. Pure, tested.
 */
export function gridColumns(available: number): number {
  if (available >= 900) return 4;
  if (available >= 480) return 3;
  return 2;
}

/**
 * Frame search on the device. Foundry's /api/storefront/products ignores `q`
 * (it returned the whole catalogue for every search), and the iPad already holds
 * the whole catalogue, so search runs here: family name, colour, shape,
 * material, optical/sun, tags. Every word must match something; the family name
 * ranks first; a small typo still finds the frame ("hileon" → HILTON). Pure, tested.
 */
import type { Product } from '@/src/api/products.types';
import { parseFrameTitle, eyewearType } from './families';
import { metaValue } from './specs';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Edit distance, stopping early once it exceeds `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]!);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length]!;
}

interface Fields { family: string[]; colour: string[]; other: string[] }

function fieldsOf(p: Product): Fields {
  const title = typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '';
  const { family, colour } = parseFrameTitle(title);
  const mf = p.metafields as Record<string, unknown> | undefined;
  const type = eyewearType(p);
  return {
    family: words(family),
    colour: words([colour ?? '', metaValue(mf, 'primary_frame_colour')].join(' ')),
    other: words([
      p.handle, p.productType ?? '', p.vendor ?? '', ...(p.tags ?? []),
      type === 'sun' ? 'sun sunglasses solaire' : type === 'optical' ? 'optical optics glasses lunettes' : '',
      metaValue(mf, 'frame_shape'), metaValue(mf, 'frame_material'), metaValue(mf, 'brow_line'), metaValue(mf, 'face_width_fit'),
    ].join(' ')),
  };
}

/** How well one query word matches a list of words: exact 3, prefix 2, inside 1, typo 0.5, none 0. */
function wordScore(q: string, list: string[]): number {
  let best = 0;
  for (const w of list) {
    if (w === q) return 3;
    if (w.startsWith(q)) best = Math.max(best, 2);
    else if (q.length >= 3 && w.includes(q)) best = Math.max(best, 1);
    else if (q.length >= 4 && w.length >= 4 && editDistance(q, w, q.length >= 6 ? 2 : 1) <= (q.length >= 6 ? 2 : 1)) best = Math.max(best, 0.5);
  }
  return best;
}

/** The score for a product, 0 when any query word matches nothing. */
export function searchScore(p: Product, query: string): number {
  const qs = words(query);
  if (!qs.length) return 1;
  const f = fieldsOf(p);
  let total = 0;
  for (const q of qs) {
    const s = Math.max(wordScore(q, f.family) * 3, wordScore(q, f.colour) * 2, wordScore(q, f.other));
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

/** Products matching every word, best first (ties keep their order). Empty query: unchanged. */
export function searchProducts<T extends Product>(products: T[], query: string): T[] {
  if (!words(query).length) return products;
  return products
    .map((p, i) => ({ p, i, s: searchScore(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p);
}

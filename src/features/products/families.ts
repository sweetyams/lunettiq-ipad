/**
 * Frame families on the device, the way lunettiq.com shows them.
 *
 * Lunettiq titles are "FAMILY © COLOUR" ("AURA © GREEN"), and each colour has
 * an optical product and a sun product (product type "Optics" / "Sunglasses").
 * The Frames grid shows one card per family; the frame page switches colour
 * and Optical / Sun from the family endpoint.
 *
 * Shopify variants on these products are legacy lens options (PLAIN, BLACK
 * FADE, POLARIZED BROWN…) priced with the lens. They are never shown: the frame
 * is the cheapest variant (Foundry's shopify-variant-cleanup rule) and lenses
 * come from the configurator.
 */
import type { Product, ProductVariant } from '@/src/api/products.types';

export type EyewearType = 'optical' | 'sun';

const titleOf = (p: Pick<Product, 'title'>) =>
  typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '';

/** "AURA © GREEN" → { family: "AURA", colour: "GREEN" }. No "©": the whole title is the family. */
export function parseFrameTitle(title: string): { family: string; colour: string | null } {
  const [family, ...rest] = title.split('©');
  const colour = rest.join('©').trim();
  return { family: (family ?? '').trim() || title.trim(), colour: colour || null };
}

/** Optical or sun from product type, tags or handle; null when unknown. */
export function eyewearType(p: Pick<Product, 'productType' | 'tags' | 'handle'>): EyewearType | null {
  const hay = [p.productType ?? '', ...(p.tags ?? [])].join(' ').toLowerCase();
  if (/\bsun(glasses)?\b/.test(hay)) return 'sun';
  if (/\boptic(s|al)?\b/.test(hay)) return 'optical';
  if (/-optics?$/.test(p.handle ?? '')) return 'optical';
  return null;
}

export interface FrameFamily {
  /** Stable key for lists. */
  key: string;
  name: string;
  /** The product the card shows and opens (optical first, then in-stock, then list order). */
  lead: Product;
  members: Product[];
  /** Distinct colours, in list order. */
  colours: string[];
  types: EyewearType[];
  priceMin: string | null;
  /** Any member in stock → in; all out → out; otherwise low. */
  stockBucket: 'in' | 'low' | 'out';
}

const stockRank = { in: 0, low: 1, out: 2 } as const;

/**
 * One entry per family, keeping the order families first appear in `products`
 * (so a sorted list stays sorted by its best member). `prefer` picks the lead
 * when the grid is filtered to one type.
 */
export function groupByFamily(products: Product[], prefer: EyewearType | null = null): FrameFamily[] {
  const byKey = new Map<string, Product[]>();
  for (const p of products) {
    const key = parseFrameTitle(titleOf(p)).family.toUpperCase() || p.shopifyId;
    const list = byKey.get(key);
    if (list) list.push(p);
    else byKey.set(key, [p]);
  }
  return [...byKey.entries()].map(([key, members]) => {
    const want = prefer ?? 'optical';
    const lead = [...members].sort((a, b) => {
      const ta = eyewearType(a) === want ? 0 : 1;
      const tb = eyewearType(b) === want ? 0 : 1;
      if (ta !== tb) return ta - tb;
      return stockRank[a.viewHints?.stockBucket ?? 'in'] - stockRank[b.viewHints?.stockBucket ?? 'in'];
    })[0]!;
    const colours: string[] = [];
    for (const m of members) {
      const c = parseFrameTitle(titleOf(m)).colour;
      if (c && !colours.some((x) => x.toLowerCase() === c.toLowerCase())) colours.push(c);
    }
    const types = (['optical', 'sun'] as const).filter((t) => members.some((m) => eyewearType(m) === t));
    const prices = members.map((m) => Number(m.priceMin)).filter((n) => Number.isFinite(n) && n > 0);
    const buckets = members.map((m) => m.viewHints?.stockBucket ?? 'in');
    const stockBucket = buckets.includes('in') ? 'in' : buckets.every((b) => b === 'out') ? 'out' : 'low';
    return {
      key,
      name: parseFrameTitle(titleOf(lead)).family,
      lead,
      members,
      colours,
      types,
      priceMin: prices.length ? String(Math.min(...prices)) : lead.priceMin,
      stockBucket,
    };
  });
}

/** True when the variants are real colour/size options rather than legacy lens variants. */
export function hasRealOptions(variants: ProductVariant[]): boolean {
  return variants.some((v) => v.selectedOptions?.some((o) => /^(colou?r|size)$/i.test(o.name)));
}

/**
 * The frame variant: the cheapest available variant, then the cheapest overall,
 * keeping list order on ties (Foundry keeps the cheapest LENS variant as the frame).
 */
export function pickFrameVariant(variants: ProductVariant[] | undefined): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  const cheapest = (list: ProductVariant[]) =>
    list.reduce<ProductVariant | undefined>((best, v) => (best == null || Number(v.price) < Number(best.price) ? v : best), undefined);
  return cheapest(variants.filter((v) => v.availableForSale)) ?? cheapest(variants);
}

import { describe, it, expect } from 'vitest';
import { parseFrameTitle, eyewearType, groupByFamily, pickFrameVariant, hasRealOptions } from '@/src/features/products/families';
import type { Product, ProductVariant } from '@/src/api/products.types';

const p = (title: string, productType: string, extra: Partial<Product> = {}): Product => ({
  shopifyId: `${title}-${productType}`, handle: title.toLowerCase().replace(/\W+/g, ''), title, vendor: 'LUNETTIQ', tags: [],
  status: 'active', productType, images: [], priceMin: '250', priceMax: '350', variantCount: 2, totalStock: 1,
  viewHints: { hasImage: true, syncStatus: 'linked', stockBucket: 'in' }, ...extra,
});
const v = (title: string, price: string, availableForSale = true, selectedOptions: ProductVariant['selectedOptions'] = []): ProductVariant => ({
  shopifyId: title, title, sku: null, price, compareAtPrice: null, availableForSale, selectedOptions, imageUrl: null,
});

describe('parseFrameTitle', () => {
  it('splits family and colour on ©', () => {
    expect(parseFrameTitle('AURA © GREEN')).toEqual({ family: 'AURA', colour: 'GREEN' });
  });
  it('keeps the whole title when there is no ©', () => {
    expect(parseFrameTitle('Gift card')).toEqual({ family: 'Gift card', colour: null });
  });
});

describe('eyewearType', () => {
  it('reads product type', () => {
    expect(eyewearType(p('AURA © GREEN', 'Sunglasses'))).toBe('sun');
    expect(eyewearType(p('AURA © GREEN', 'Optics'))).toBe('optical');
  });
  it('falls back to the -optics handle', () => {
    expect(eyewearType({ productType: null, tags: [], handle: 'auragreen-optics' })).toBe('optical');
  });
});

describe('groupByFamily', () => {
  const list = [
    p('AURA © GREEN', 'Sunglasses'),
    p('HATLEY © TORTOISE', 'Optics'),
    p('AURA © GREEN', 'Optics', { priceMin: '175' }),
    p('AURA © TORTOISE', 'Optics', { viewHints: { hasImage: true, syncStatus: 'linked', stockBucket: 'out' } }),
  ];
  const groups = groupByFamily(list);

  it('makes one entry per family in first-seen order', () => {
    expect(groups.map((g) => g.name)).toEqual(['AURA', 'HATLEY']);
    expect(groups[0]!.members).toHaveLength(3);
  });
  it('lists colours once and both types', () => {
    expect(groups[0]!.colours).toEqual(['GREEN', 'TORTOISE']);
    expect(groups[0]!.types).toEqual(['optical', 'sun']);
  });
  it('leads with an in-stock optical frame and the lowest price', () => {
    expect(eyewearType(groups[0]!.lead)).toBe('optical');
    expect(groups[0]!.lead.viewHints.stockBucket).toBe('in');
    expect(groups[0]!.priceMin).toBe('175');
  });
  it('leads with sun when the grid is filtered to sun', () => {
    expect(eyewearType(groupByFamily(list, 'sun')[0]!.lead)).toBe('sun');
  });
});

describe('pickFrameVariant', () => {
  it('takes the cheapest available legacy lens variant as the frame', () => {
    const variants = [v('BLACK FADE', '300'), v('BLACK', '250'), v('POLARIZED BLACK', '350')];
    expect(pickFrameVariant(variants)?.title).toBe('BLACK');
  });
  it('prefers an available variant over a cheaper sold-out one', () => {
    expect(pickFrameVariant([v('PLAIN', '250', false), v('BLUE LIGHT', '260')])?.title).toBe('BLUE LIGHT');
  });
  it('keeps list order on ties', () => {
    expect(pickFrameVariant([v('BLACK', '250'), v('BROWN', '250')])?.title).toBe('BLACK');
  });
});

describe('hasRealOptions', () => {
  it('is false for legacy lens variants and true for colour options', () => {
    expect(hasRealOptions([v('BLACK', '250')])).toBe(false);
    expect(hasRealOptions([v('Red', '250', true, [{ name: 'Colour', value: 'Red' }])])).toBe(true);
  });
});

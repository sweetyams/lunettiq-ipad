import { describe, it, expect } from 'vitest';
import { searchProducts, editDistance } from '@/src/features/products/search';
import type { Product } from '@/src/api/products.types';

const p = (title: string, productType: string, extra: Partial<Product> = {}): Product => ({
  shopifyId: `${title}-${productType}`, handle: title.toLowerCase().replace(/\W+/g, ''), title, vendor: 'LUNETTIQ', tags: [],
  status: 'active', productType, images: [], priceMin: '250', priceMax: '250', variantCount: 1, totalStock: 1,
  viewHints: { hasImage: true, syncStatus: 'linked', stockBucket: 'in' }, ...extra,
});

const catalogue = [
  p('HATLEY © TORTOISE', 'Optics'),
  p('NOA © BLACK', 'Optics'),
  p('NOA © MOKA', 'Sunglasses'),
  p('HILTON © GREEN', 'Optics', { metafields: { 'custom.frame_shape': { value: 'Square' } } }),
  p('HILTON © RED', 'Sunglasses'),
  p('NOVA © GREEN', 'Optics'),
];
const names = (q: string) => searchProducts(catalogue, q).map((x) => x.title);

describe('frame search', () => {
  it('finds a family by name, and nothing else', () => {
    expect(names('noa')).toEqual(['NOA © BLACK', 'NOA © MOKA']);
  });
  it('tolerates a typo in the name', () => {
    expect(names('hileon')).toEqual(['HILTON © GREEN', 'HILTON © RED']);
  });
  it('matches the start of a name', () => {
    expect(names('hil')).toEqual(['HILTON © GREEN', 'HILTON © RED']);
  });
  it('ranks the family name above a colour', () => {
    expect(names('green')).toEqual(['HILTON © GREEN', 'NOVA © GREEN']);
  });
  it('needs every word: name + type', () => {
    expect(names('hilton sun')).toEqual(['HILTON © RED']);
  });
  it('searches shape', () => {
    expect(names('square')).toEqual(['HILTON © GREEN']);
  });
  it('returns everything for an empty query', () => {
    expect(names('  ')).toHaveLength(catalogue.length);
  });
  it('measures edit distance', () => {
    expect(editDistance('hileon', 'hilton')).toBe(1);
    expect(editDistance('noa', 'nova', 1)).toBe(1);
  });
});

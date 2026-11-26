import { describe, it, expect, vi } from 'vitest';

vi.mock('expo-router', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('expo-image', () => ({ Image: () => null }));
vi.mock('react-native', () => ({ View: () => null, Text: () => null, ScrollView: () => null, Pressable: () => null }));
vi.mock('@/src/api/useProductFamily', () => ({ useProductFamily: () => ({ data: undefined }) }));

import { familyView } from '@/src/ui/ColourSiblings';
import type { ProductSibling } from '@/src/api/families.types';

const sib = (shopifyId: string, colour: string, type: 'optical' | 'sun', sortOrder = 0): ProductSibling => ({
  shopifyId, colour, type, sortOrder, handle: `${colour}-${type}`.toLowerCase(), title: `HILTON © ${colour}`, colourHex: null, image: null,
});

// HILTON: green and red in both types, marble blue optical only; sun colour names in a different case.
const siblings = [
  sib('og', 'GREEN', 'optical', 0), sib('ob', 'MARBLE BLUE', 'optical', 1), sib('or', 'RED', 'optical', 2),
  sib('sg', 'Green', 'sun', 0), sib('sr', 'Red', 'sun', 1),
];

describe('familyView (Optical / Sun switcher)', () => {
  it('is on the type of the frame on screen', () => {
    expect(familyView(siblings, { shopifyId: 'sg' }).activeType).toBe('sun');
    expect(familyView(siblings, { shopifyId: 'og' }).activeType).toBe('optical');
  });
  it('uses the frame’s own type while the family is loading', () => {
    expect(familyView([], { shopifyId: 'sg' }, 'sun').activeType).toBe('sun');
  });
  it('lists only the active type’s colours', () => {
    expect(familyView(siblings, { shopifyId: 'sr' }).colours.map((s) => s.shopifyId)).toEqual(['sg', 'sr']);
  });
  it('switches to the same colour in the other type, ignoring case', () => {
    expect(familyView(siblings, { shopifyId: 'og' }).targetFor('sun')?.shopifyId).toBe('sg');
    expect(familyView(siblings, { shopifyId: 'sr' }).targetFor('optical')?.shopifyId).toBe('or');
  });
  it('falls back to the other type’s first colour when this colour has none', () => {
    expect(familyView(siblings, { shopifyId: 'ob' }).targetFor('sun')?.shopifyId).toBe('sg');
  });
  it('does nothing when tapping the type already shown', () => {
    expect(familyView(siblings, { shopifyId: 'og' }).targetFor('optical')).toBeNull();
  });
});

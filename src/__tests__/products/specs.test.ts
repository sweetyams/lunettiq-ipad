import { describe, it, expect } from 'vitest';
import { frameSpecs, humanise, frameCallouts, lowStockCount } from '@/src/features/products/specs';

// Shaped like AURA © GREEN on lunettiq.com.
const mf = {
  'custom.frame_shape': { value: 'Rectangular' },
  'custom.frame_material': { value: 'Acetate' },
  'custom.brow_line': { value: 'full_rim' },
  'custom.hinge_type': { value: 'obe_hinge' },
  'custom.face_width_fit': { value: 'wide' },
  'custom.uv_protection': { value: '100% UVA/UVB' },
  'custom.prescription_compatible': { value: 'true' },
  'custom.progressive_suitable': { value: 'false' },
  'custom.warranty': { value: '2 years' },
  'custom.composition': { value: '* Acetate' },
};

describe('frame specs', () => {
  it('reads the spec metafields in order, in plain words', () => {
    expect(frameSpecs(mf)).toEqual([
      { label: 'Shape', value: 'Rectangular' },
      { label: 'Material', value: 'Acetate' },
      { label: 'Rim', value: 'Full rim' },
      { label: 'Hinge', value: 'OBE hinge' },
      { label: 'Face width', value: 'Wide' },
      { label: 'UV protection', value: '100% UVA/UVB' },
      { label: 'Takes a prescription', value: 'Yes' },
      { label: 'Progressives', value: 'No' },
      { label: 'Warranty', value: '2 years' },
    ]);
  });
  it('is empty without metafields', () => {
    expect(frameSpecs(undefined)).toEqual([]);
  });
  it('humanises codes', () => {
    expect(humanise('obe_hinge')).toBe('OBE hinge');
    expect(humanise('semi-rimless')).toBe('Semi rimless');
  });
});

describe('callouts and low stock', () => {
  it('adds the UV line only for sunglasses', () => {
    expect(frameCallouts('sun')).toContain('UVA UVB protection included with tint');
    expect(frameCallouts('optical')).not.toContain('UVA UVB protection included with tint');
  });
  it('counts low stock between 1 and 3', () => {
    expect(lowStockCount(2)).toBe(2);
    expect(lowStockCount(0)).toBeNull();
    expect(lowStockCount(12)).toBeNull();
    expect(lowStockCount(undefined)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { frameSizes } from '@/src/features/products/sizing';

describe('frameSizes', () => {
  it('reads the sizing text the way the web does', () => {
    const mf = { 'custom.sizing_dimensions': { type: 'multi_line_text_field', value: 'Nose Bridge: 21\nWidth: 47\nLength: 145' } };
    expect(frameSizes(mf)).toEqual([
      { label: 'Lens width', value: '47 mm' },
      { label: 'Bridge', value: '21 mm' },
      { label: 'Temple', value: '145 mm' },
    ]);
  });
  it('prefers separate number fields and keeps unknown lines', () => {
    const mf = { 'custom.lens_width': { value: 50 }, 'custom.sizing_dimensions': { value: 'Width: 47\nWeight: 22g' } };
    expect(frameSizes(mf)).toEqual([
      { label: 'Lens width', value: '50 mm' },
      { label: 'Weight', value: '22g' },
    ]);
  });
  it('is empty without sizing', () => {
    expect(frameSizes({ 'custom.composition': { value: 'Acetate' } })).toEqual([]);
    expect(frameSizes(undefined)).toEqual([]);
  });
});

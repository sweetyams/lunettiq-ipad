/**
 * A frame's specs from its metafields, the fields lunettiq.com's product data
 * carries (custom.frame_shape, hinge_type, uv_protection…), in plain words.
 * Metafields arrive flat: { "custom.frame_shape": { value } }. Pure, tested.
 */
type Metafields = Record<string, unknown> | undefined | null;

export interface SpecRow { label: string; value: string }

const FIELDS: { key: string; label: string; kind?: 'bool' | 'words' }[] = [
  { key: 'frame_shape', label: 'Shape', kind: 'words' },
  { key: 'frame_material', label: 'Material', kind: 'words' },
  { key: 'brow_line', label: 'Rim', kind: 'words' },
  { key: 'hinge_type', label: 'Hinge', kind: 'words' },
  { key: 'face_width_fit', label: 'Face width', kind: 'words' },
  { key: 'primary_frame_colour', label: 'Frame colour', kind: 'words' },
  { key: 'default_lens_colour', label: 'Lens as shown', kind: 'words' },
  { key: 'lens_coating', label: 'Lens coating' },
  { key: 'uv_protection', label: 'UV protection' },
  { key: 'prescription_compatible', label: 'Takes a prescription', kind: 'bool' },
  { key: 'progressive_suitable', label: 'Progressives', kind: 'bool' },
  { key: 'high_prescription_suitable', label: 'High prescriptions', kind: 'bool' },
  { key: 'included_accessories', label: 'Included' },
  { key: 'warranty', label: 'Warranty' },
];

/** A metafield's plain value, or '' when missing. */
export function metaValue(mf: Metafields, key: string): string {
  if (!mf) return '';
  const raw = mf[`custom.${key}`] ?? mf[key];
  const v = raw && typeof raw === 'object' && 'value' in (raw as object) ? (raw as { value: unknown }).value : raw;
  if (v == null) return '';
  return String(v).trim();
}

/** "obe_hinge" → "OBE hinge", "full_rim" → "Full rim", "wide" → "Wide". Short all-letter codes stay upper case. */
export function humanise(v: string): string {
  const words = v.replace(/[_-]+/g, ' ').trim().split(/\s+/);
  return words
    .map((w, i) => (/^[a-z]{2,3}$/i.test(w) && i === 0 && words.length > 1 ? w.toUpperCase() : i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase()))
    .join(' ');
}

export function frameSpecs(mf: Metafields): SpecRow[] {
  const out: SpecRow[] = [];
  for (const f of FIELDS) {
    const v = metaValue(mf, f.key);
    if (!v) continue;
    if (f.kind === 'bool') {
      const yes = /^(true|yes|1)$/i.test(v);
      const no = /^(false|no|0)$/i.test(v);
      out.push({ label: f.label, value: yes ? 'Yes' : no ? 'No' : v });
    } else {
      out.push({ label: f.label, value: f.kind === 'words' ? humanise(v) : v });
    }
  }
  return out;
}

/** lunettiq.com's buy-box lines (product.callout.*): UV only for sunglasses. */
export function frameCallouts(type: 'optical' | 'sun' | null): string[] {
  return [
    'Includes high quality German lenses',
    '2 year warranty',
    ...(type === 'sun' ? ['UVA UVB protection included with tint'] : []),
    'Case & cloth included',
  ];
}

/** "Only N left" when the frame has 1–threshold units for sale; null otherwise or when unknown. */
export function lowStockCount(quantity: number | null | undefined, threshold = 3): number | null {
  return typeof quantity === 'number' && quantity >= 1 && quantity <= threshold ? quantity : null;
}

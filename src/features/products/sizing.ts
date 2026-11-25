/**
 * Frame measurements, read the way lunettiq.com reads them (Foundry
 * storefront/pdp/sizing.ts). Metafields arrive flat: { "custom.sizing_dimensions":
 * { type, value } }. Most products keep one text field ("Nose Bridge: 21\nWidth:
 * 47\nLength: 145"); a few have separate lens_width / bridge_width / temple_length.
 */
type Metafields = Record<string, unknown> | undefined | null;

export interface SizeRow { label: string; value: string }

const KINDS: { kind: string; label: string; match: RegExp; keys: string[] }[] = [
  { kind: 'lens', label: 'Lens width', match: /lens\s*width|^width$|^a$/i, keys: ['lens_width', 'lens_width_mm'] },
  { kind: 'bridge', label: 'Bridge', match: /bridge|^b$/i, keys: ['bridge_width', 'bridge_width_mm', 'bridge'] },
  { kind: 'length', label: 'Temple', match: /temple|arm|length|^c$/i, keys: ['temple_length', 'temple_length_mm', 'temple'] },
  { kind: 'frameWidth', label: 'Frame width', match: /frame\s*width|total\s*width/i, keys: ['frame_width', 'frame_width_mm'] },
  { kind: 'lensHeight', label: 'Lens height', match: /height/i, keys: ['lens_height', 'lens_height_mm'] },
];

const mm = (v: unknown) => {
  const t = String(v).trim();
  return /^\d+(\.\d+)?$/.test(t) ? `${t} mm` : t;
};

/** A metafield's value under `custom.<key>`, `<key>`, or a nested `custom` object. */
function read(mf: Metafields, key: string): unknown {
  if (!mf) return undefined;
  const unwrap = (x: unknown) => (x && typeof x === 'object' && 'value' in (x as object) ? (x as { value: unknown }).value : x);
  const nested = (mf.custom && typeof mf.custom === 'object' ? (mf.custom as Record<string, unknown>)[key] : undefined);
  const v = unwrap(mf[`custom.${key}`]) ?? unwrap(mf[key]) ?? unwrap(nested);
  return v == null || v === '' ? undefined : v;
}

/** Lens, bridge, temple first, then frame width and lens height. Empty when the frame has none. */
export function frameSizes(mf: Metafields): SizeRow[] {
  const found = new Map<string, string>();
  for (const k of KINDS) {
    const v = k.keys.map((key) => read(mf, key)).find((x) => x != null);
    if (v != null) found.set(k.kind, mm(v));
  }
  const textValue = read(mf, 'sizing_dimensions') ?? read(mf, 'size_dimensions');
  const extra: SizeRow[] = [];
  if (typeof textValue === 'string') {
    for (const line of textValue.split(/\r?\n/)) {
      const m = /^\s*([^:]+?)\s*:\s*(.+?)\s*$/.exec(line);
      if (!m) continue;
      const [, label, value] = m as unknown as [string, string, string];
      const k = KINDS.find((x) => x.match.test(label.trim()));
      if (k) { if (!found.has(k.kind)) found.set(k.kind, mm(value)); }
      else extra.push({ label: label.trim(), value: mm(value) });
    }
  }
  return [
    ...KINDS.filter((k) => found.has(k.kind)).map((k) => ({ label: k.label, value: found.get(k.kind)! })),
    ...extra,
  ];
}

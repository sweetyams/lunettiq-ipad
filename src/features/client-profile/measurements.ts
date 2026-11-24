/**
 * Optical measurements on the client file (gap checklist, Customer profile).
 *
 * The fields are a *template*, not hard-coded inputs: an optical store can reuse the
 * same structure with its own field list. Lunettiq's template is the default. Until
 * Foundry has a measurements table (docs/v2/05-foundry-api-requests.md §Measurements),
 * readings are stored on the client's enrichment `customFields.measurements` as a
 * history, newest first, so nothing is lost and Foundry can migrate them later.
 */

export type MeasurementFieldKind = 'mm' | 'text' | 'note' | 'sph';

export interface MeasurementField {
  key: string;
  label: { en: string; fr: string };
  kind: MeasurementFieldKind;
  /** Right/left pair (OD/OS) rendered side by side. */
  perEye?: boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: { en: string; fr: string };
}

export interface MeasurementTemplate {
  id: string;
  version: number;
  groups: Array<{ key: string; label: { en: string; fr: string }; fields: MeasurementField[] }>;
}

export const LUNETTIQ_MEASUREMENTS: MeasurementTemplate = {
  id: 'lunettiq-optical',
  version: 1,
  groups: [
    {
      key: 'centration',
      label: { en: 'Fitting', fr: 'Centrage' },
      fields: [
        { key: 'pd', label: { en: 'PD (mono)', fr: 'EP (mono)' }, kind: 'mm', perEye: true, min: 20, max: 40, step: 0.5,
          hint: { en: 'Each eye from the bridge centre.', fr: 'Chaque œil depuis le centre du pont.' } },
        { key: 'pdBinocular', label: { en: 'PD (total)', fr: 'EP (totale)' }, kind: 'mm', min: 45, max: 80, step: 0.5,
          hint: { en: 'Leave blank if you took monocular PD.', fr: 'Laisser vide si l’EP mono est prise.' } },
        { key: 'ocHeight', label: { en: 'Height / OC', fr: 'Hauteur / CO' }, kind: 'mm', perEye: true, min: 8, max: 40, step: 0.5,
          hint: { en: 'Pupil centre to the bottom of the lens, in the chosen frame.', fr: 'Centre pupille jusqu’au bas du verre, dans la monture choisie.' } },
      ],
    },
    {
      key: 'reading',
      label: { en: 'In-store reading', fr: 'Lecture en magasin' },
      fields: [
        { key: 'lensometer', label: { en: 'Lensometer (current glasses)', fr: 'Frontofocomètre (lunettes actuelles)' }, kind: 'sph', perEye: true,
          hint: { en: 'When they didn’t bring a prescription: read their current pair.', fr: 'Sans ordonnance : lire leur paire actuelle.' } },
      ],
    },
    {
      key: 'who',
      label: { en: 'Taken by', fr: 'Pris par' },
      fields: [
        { key: 'opticianName', label: { en: 'Optician', fr: 'Opticien·ne' }, kind: 'text' },
        { key: 'notes', label: { en: 'Notes', fr: 'Notes' }, kind: 'note' },
      ],
    },
  ],
};

/** One reading: values keyed `field` or `field.od` / `field.os`. */
export interface MeasurementRecord {
  id: string;
  templateId: string;
  templateVersion: number;
  takenAt: string;
  values: Record<string, string>;
  /** Frame the heights were taken in, when known. */
  frame?: string | null;
}

export function fieldKeys(field: MeasurementField): string[] {
  return field.perEye ? [`${field.key}.od`, `${field.key}.os`] : [field.key];
}

/** Error text for one value, or null when it's fine (blank is fine: nothing is required). */
export function validateValue(field: MeasurementField, raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (field.kind === 'mm') {
    const n = Number(v.replace(',', '.'));
    if (!Number.isFinite(n)) return 'Numbers only.';
    if ((field.min != null && n < field.min) || (field.max != null && n > field.max)) return `Expected ${field.min}–${field.max} mm.`;
  }
  if (field.kind === 'sph') {
    // "-2.25 -0.50 x180" or "+1.00": loose, staff type what the lensometer shows.
    if (!/^[+-]?\d{1,2}([.,]\d{1,2})?(\s+[+-]?\d{1,2}([.,]\d{1,2})?(\s*[x×]\s*\d{1,3})?)?$/i.test(v)) return 'e.g. -2.25 -0.50 x180';
  }
  return null;
}

export function validateRecord(t: MeasurementTemplate, values: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const g of t.groups) for (const f of g.fields) for (const k of fieldKeys(f)) {
    const e = validateValue(f, values[k] ?? '');
    if (e) errors[k] = e;
  }
  return errors;
}

/** Drop blanks, normalise decimal commas in mm fields. */
export function cleanValues(t: MeasurementTemplate, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const g of t.groups) for (const f of g.fields) for (const k of fieldKeys(f)) {
    const v = (values[k] ?? '').trim();
    if (!v) continue;
    out[k] = f.kind === 'mm' ? v.replace(',', '.') : v;
  }
  return out;
}

/** History stored on enrichment.customFields, newest first. Tolerates junk. */
export function readMeasurements(customFields: Record<string, unknown> | null | undefined): MeasurementRecord[] {
  const raw = customFields?.measurements;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is MeasurementRecord => !!r && typeof r === 'object' && typeof (r as MeasurementRecord).takenAt === 'string' && typeof (r as MeasurementRecord).values === 'object')
    .sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt));
}

/** customFields with the new record prepended (keeps the last 20). */
export function withMeasurement(customFields: Record<string, unknown> | null | undefined, record: MeasurementRecord): Record<string, unknown> {
  return { ...(customFields ?? {}), measurements: [record, ...readMeasurements(customFields)].slice(0, 20) };
}

/** "PD 31/31.5 · OC 22/22 · J. Roy" for one-line summaries. */
export function summarize(record: MeasurementRecord | undefined): string | null {
  if (!record) return null;
  const v = record.values;
  const pair = (k: string) => (v[`${k}.od`] || v[`${k}.os`] ? `${v[`${k}.od`] ?? '–'}/${v[`${k}.os`] ?? '–'}` : null);
  const parts = [
    pair('pd') ? `PD ${pair('pd')}` : v.pdBinocular ? `PD ${v.pdBinocular}` : null,
    pair('ocHeight') ? `OC ${pair('ocHeight')}` : null,
    pair('lensometer') ? `Lenso ${pair('lensometer')}` : null,
    v.opticianName || null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Prescription fit flag (gap checklist, Customer profile): warn staff when a frame
 * is a poor match for the client's prescription. It never blocks the choice: the
 * client picks their frame, staff just know what to explain (thicker edges, a
 * shorter progressive corridor) before the lab finds out.
 *
 * Rules are deliberately few and conservative. The optician should confirm them
 * before they're shown to clients (docs/v2/06-gap-checklist-plan.md §Smart rules).
 */
import type { Prescription } from '@/src/api/prescriptions.types';

export interface FrameSize {
  /** Lens (eye) width in mm, e.g. 52 in "52□18-145". */
  lensWidth: number | null;
  bridge: number | null;
  /** Lens height (B measurement) in mm, when the catalogue has it. */
  lensHeight: number | null;
}

export interface FitFlag {
  key: 'high_minus_wide' | 'high_plus_wide' | 'progressive_short' | 'high_cyl_wide';
  severity: 'info' | 'caution';
  message: { en: string; fr: string };
}

/** "52□18-145", "52-18-145", "52 18 145", "Size 52/18" → sizes. */
export function parseFrameSize(text: string | null | undefined): FrameSize {
  const none: FrameSize = { lensWidth: null, bridge: null, lensHeight: null };
  if (!text) return none;
  const m = text.match(/\b([3-6]\d)\s*(?:□|[-/x×\s])\s*([1-2]\d)(?:\s*[-/\s]\s*(1[2-5]\d))?\b/);
  if (!m) return none;
  return { lensWidth: Number(m[1]), bridge: Number(m[2]), lensHeight: null };
}

/** Pull sizes from a product: metafields first (lens_width, lens_height, bridge), then title/tags/options. */
export function frameSizeOf(product: {
  title?: unknown; tags?: string[]; metafields?: Record<string, unknown>; options?: Array<{ name: string; values: string[] }>;
}): FrameSize {
  const mf = product.metafields ?? {};
  const num = (...keys: string[]) => {
    for (const k of keys) {
      const v = mf[k];
      const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };
  const fromMeta: FrameSize = {
    lensWidth: num('lens_width', 'lensWidth', 'eye_size', 'custom.lens_width'),
    bridge: num('bridge', 'bridge_width', 'bridgeWidth', 'custom.bridge'),
    lensHeight: num('lens_height', 'lensHeight', 'b_measurement', 'custom.lens_height'),
  };
  if (fromMeta.lensWidth) return fromMeta;
  const title = typeof product.title === 'string' ? product.title : (product.title as Record<string, string> | undefined)?.en;
  const texts = [title, ...(product.tags ?? []), ...(product.options ?? []).flatMap((o) => o.values)];
  for (const t of texts) {
    const s = parseFrameSize(t);
    if (s.lensWidth) return { ...s, lensHeight: fromMeta.lensHeight };
  }
  return { ...fromMeta };
}

const strongest = (a?: number, b?: number) => Math.max(Math.abs(a ?? 0), Math.abs(b ?? 0));
const signed = (a?: number, b?: number) => (Math.abs(a ?? 0) >= Math.abs(b ?? 0) ? a ?? 0 : b ?? 0);

/** Warnings for one frame against the latest prescription. Empty when nothing to say or not enough data. */
export function rxFitFlags(rx: Prescription | null | undefined, size: FrameSize): FitFlag[] {
  if (!rx) return [];
  const flags: FitFlag[] = [];
  const sph = signed(rx.sphereOd, rx.sphereOs);
  const cyl = strongest(rx.cylinderOd, rx.cylinderOs);
  const add = Math.max(rx.addOd ?? 0, rx.addOs ?? 0);
  const w = size.lensWidth;

  if (w != null && sph <= -4 && w >= 52) {
    flags.push({ key: 'high_minus_wide', severity: sph <= -6 ? 'caution' : 'info', message: {
      en: `Strong minus (${sph.toFixed(2)}): a ${w} mm lens will have thick edges. Suggest a smaller eye size or high-index lenses.`,
      fr: `Forte myopie (${sph.toFixed(2)}) : un verre de ${w} mm aura des bords épais. Proposer une taille plus petite ou des verres amincis.`,
    } });
  }
  if (w != null && sph >= 3 && w >= 52) {
    flags.push({ key: 'high_plus_wide', severity: sph >= 5 ? 'caution' : 'info', message: {
      en: `Strong plus (+${sph.toFixed(2)}): a ${w} mm lens will be thick in the centre and magnify. A smaller, rounder shape suits better.`,
      fr: `Forte hypermétropie (+${sph.toFixed(2)}) : un verre de ${w} mm sera épais au centre et grossira. Une forme plus petite et ronde convient mieux.`,
    } });
  }
  if (w != null && cyl >= 2.5 && w >= 54) {
    flags.push({ key: 'high_cyl_wide', severity: 'info', message: {
      en: `High astigmatism (${cyl.toFixed(2)}): wide lenses add edge thickness at the axis. Worth mentioning high-index.`,
      fr: `Astigmatisme élevé (${cyl.toFixed(2)}) : les verres larges épaississent les bords. Mentionner les verres amincis.`,
    } });
  }
  if (add > 0 && size.lensHeight != null && size.lensHeight < 28) {
    flags.push({ key: 'progressive_short', severity: 'caution', message: {
      en: `Progressive wearer (ADD +${add.toFixed(2)}): this lens is ${size.lensHeight} mm tall; under 28 mm the reading zone gets cramped. A short-corridor design can work.`,
      fr: `Porteur de progressifs (ADD +${add.toFixed(2)}) : ce verre fait ${size.lensHeight} mm de haut; sous 28 mm la zone de lecture est étroite. Un design à couloir court peut convenir.`,
    } });
  }
  return flags;
}

/** True when the latest Rx shows a reading addition: the progressive conversation applies. */
export function isLikelyProgressive(rx: Prescription | null | undefined): boolean {
  return !!rx && Math.max(rx.addOd ?? 0, rx.addOs ?? 0) > 0;
}

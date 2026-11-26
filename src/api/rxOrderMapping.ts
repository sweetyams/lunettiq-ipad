import type { CartResult, ConfiguratorPriceSummary } from './configurator.types';

const LENS_TYPES = ['sv', 'bifocal', 'progressive', 'office', 'antifatigue'] as const;
const MATERIALS = ['CR39', '1.56', 'polycarbonate', '1.60', '1.67', '1.74'] as const;

/** Configurator wording → Foundry's TRISO lens type enum. */
export function toLensType(v: string | undefined): (typeof LENS_TYPES)[number] | undefined {
  const s = (v ?? '').toLowerCase().replace(/[\s_-]+/g, '');
  if (!s) return undefined;
  if (s === 'sv' || s.includes('singlevision') || s === 'single') return 'sv';
  if (s.includes('progressive') || s.includes('varifocal')) return 'progressive';
  if (s.includes('bifocal')) return 'bifocal';
  if (s.includes('office') || s.includes('computer')) return 'office';
  if (s.includes('antifatigue') || s.includes('relax')) return 'antifatigue';
  return undefined;
}

export function toLensMaterial(v: string | undefined): (typeof MATERIALS)[number] | undefined {
  const s = (v ?? '').toLowerCase().replace(/[\s-]+/g, '');
  if (!s) return undefined;
  if (s.includes('cr39') || s === '1.50' || s === '1.5') return 'CR39';
  if (s.includes('poly')) return 'polycarbonate';
  return MATERIALS.find((m) => s.includes(m.toLowerCase()));
}

export interface RxOrderInput {
  clientId: string;
  productId: string;
  productName: string;
  variantId?: string;
  prescriptionId?: string | null;
  notes?: string;
  cart: CartResult;
  price: ConfiguratorPriceSummary;
  /** The visit (try-on session) the order came from. */
  sessionId?: string | null;
}

/**
 * iPad order → Foundry `rxOrderCreateSchema` (POST /api/admin/rx-pipeline/orders).
 * Foundry requires `customerId`; unknown keys are dropped by its Zod parse, so the
 * full configuration travels in `lensSpec`.
 */
export function toRxOrderCreate(i: RxOrderInput) {
  const attrs = Object.fromEntries((i.cart.attributes ?? []).map((a) => [a.key, a.value]));
  const coatings = (attrs._coatings ?? '').split(',').map((s) => s.trim()).filter((s) => s && s !== 'none');
  const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);
  return {
    customerId: i.clientId,
    prescriptionId: isUuid(i.prescriptionId ?? undefined) ? i.prescriptionId! : undefined,
    lensType: toLensType(attrs._lensType),
    lensMaterial: toLensMaterial(attrs._lensIndex),
    lensTreatments: coatings.length ? coatings : undefined,
    lensSpec: {
      productId: i.productId,
      productName: i.productName,
      shopifyVariantId: i.variantId ?? null,
      // The visit it was ordered in (Foundry's Rx order has no column for it yet).
      ...(i.sessionId ? { tryonSessionId: i.sessionId } : {}),
      attributes: attrs,
      addons: (i.cart.addonLines ?? []).map((l) => Object.fromEntries((l.attributes ?? []).map((a) => [a.key, a.value]))),
      pricingLines: i.price.pricingLines,
    },
    totalCents: Math.round(i.price.total),
    quoteTotalCents: Math.round(i.price.total),
    labNotes: i.notes?.trim() || undefined,
  };
}

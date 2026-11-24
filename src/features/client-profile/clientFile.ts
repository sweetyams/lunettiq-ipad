/**
 * Extra client-file facts staff asked for (gap checklist, Customer profile):
 * - Handoff context: what this client is coming back for, so any colleague can continue.
 * - Frame collection: the pairs they own, by role, so staff can see what is missing.
 *
 * Stored on enrichment `customFields` (`handoff`, `collection`) until Foundry has
 * first-class fields (docs/v2/05-foundry-api-requests.md §Client file).
 */

export const HANDOFF_REASONS = ['sunglasses', 'second_pair', 'third_pair', 'event', 'travel', 'sport', 'kids'] as const;
export type HandoffReason = (typeof HANDOFF_REASONS)[number];

export const HANDOFF_LABELS: Record<HandoffReason, { en: string; fr: string }> = {
  sunglasses: { en: 'Sunglasses', fr: 'Solaires' },
  second_pair: { en: 'Second pair', fr: 'Deuxième paire' },
  third_pair: { en: 'Third pair', fr: 'Troisième paire' },
  event: { en: 'An event', fr: 'Un événement' },
  travel: { en: 'Travel', fr: 'Voyage' },
  sport: { en: 'Sport', fr: 'Sport' },
  kids: { en: 'For their kids', fr: 'Pour leurs enfants' },
};

export interface Handoff {
  reasons: HandoffReason[];
  note: string;
  /** "By Dec 12", free text. */
  when: string;
  updatedAt: string;
  updatedBy: string | null;
}

export const COLLECTION_ROLES = ['everyday', 'going_out', 'sun', 'computer', 'reading', 'sport'] as const;
export type CollectionRole = (typeof COLLECTION_ROLES)[number];

export const COLLECTION_LABELS: Record<CollectionRole, { en: string; fr: string }> = {
  everyday: { en: 'Everyday / work', fr: 'Quotidien / travail' },
  going_out: { en: 'Going out', fr: 'Sorties' },
  sun: { en: 'Sun', fr: 'Solaire' },
  computer: { en: 'Computer', fr: 'Ordinateur' },
  reading: { en: 'Reading', fr: 'Lecture' },
  sport: { en: 'Sport', fr: 'Sport' },
};

/** The roles most clients are missing first; the profile prompts for these. */
export const CORE_ROLES: CollectionRole[] = ['everyday', 'going_out', 'sun'];

export interface CollectionPair {
  id: string;
  role: CollectionRole;
  frame: string;
  /** Bought here or brought in. */
  fromUs: boolean;
  year?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function readHandoff(customFields: Record<string, unknown> | null | undefined): Handoff | null {
  const h = customFields?.handoff;
  if (!isObj(h)) return null;
  const reasons = Array.isArray(h.reasons) ? h.reasons.filter((r): r is HandoffReason => HANDOFF_REASONS.includes(r as HandoffReason)) : [];
  const note = typeof h.note === 'string' ? h.note : '';
  const when = typeof h.when === 'string' ? h.when : '';
  if (!reasons.length && !note.trim() && !when.trim()) return null;
  return { reasons, note, when, updatedAt: typeof h.updatedAt === 'string' ? h.updatedAt : '', updatedBy: typeof h.updatedBy === 'string' ? h.updatedBy : null };
}

export function withHandoff(customFields: Record<string, unknown> | null | undefined, h: Handoff | null): Record<string, unknown> {
  const next = { ...(customFields ?? {}) };
  if (!h || (!h.reasons.length && !h.note.trim() && !h.when.trim())) delete next.handoff;
  else next.handoff = h;
  return next;
}

export function readCollection(customFields: Record<string, unknown> | null | undefined): CollectionPair[] {
  const c = customFields?.collection;
  if (!Array.isArray(c)) return [];
  return c.filter((p): p is CollectionPair => isObj(p) && typeof p.id === 'string' && typeof p.frame === 'string' && COLLECTION_ROLES.includes(p.role as CollectionRole));
}

export function withCollection(customFields: Record<string, unknown> | null | undefined, pairs: CollectionPair[]): Record<string, unknown> {
  return { ...(customFields ?? {}), collection: pairs };
}

/** Core roles with no pair yet: the conversation starter for the next sale. */
export function missingRoles(pairs: CollectionPair[]): CollectionRole[] {
  const have = new Set(pairs.map((p) => p.role));
  return CORE_ROLES.filter((r) => !have.has(r));
}

/** One line for headers: "Coming back for: Sunglasses, Travel · by Dec 12". */
export function handoffLine(h: Handoff | null, lang: 'en' | 'fr'): string | null {
  if (!h) return null;
  const reasons = h.reasons.map((r) => HANDOFF_LABELS[r][lang]).join(', ');
  const parts = [reasons, h.when.trim() ? (lang === 'fr' ? `d’ici ${h.when.trim()}` : `by ${h.when.trim()}`) : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : h.note.trim() || null;
}

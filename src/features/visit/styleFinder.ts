/**
 * Guided questions for floor staff (gap checklist, Walk-in and intake): a short
 * list of questions that leads to frame suggestions, e.g. "funky + oversized → June".
 *
 * Two layers:
 * 1. Named picks: the store's own rules ("funky + oversized → June"). These are
 *    the knowledge staff want written down; Seren owns the list. Shipped as config
 *    until Foundry stores it (docs/v2/05-foundry-api-requests.md §Style finder).
 * 2. Keyword scoring against catalogue tags and titles, so every answer still
 *    narrows the catalogue when no named pick matches.
 */

export type Use = 'optical' | 'sun';
export type Personality = 'classic' | 'minimal' | 'bold' | 'funky';
export type Size = 'fitted' | 'medium' | 'oversized';
export type Shape = 'round' | 'square' | 'cat_eye' | 'aviator' | 'any';
export type Tone = 'black' | 'tortoise' | 'colour' | 'clear' | 'any';

export interface StyleAnswers {
  use?: Use;
  personality?: Personality;
  size?: Size;
  shape?: Shape;
  tone?: Tone;
}

export interface StyleQuestion<K extends keyof StyleAnswers = keyof StyleAnswers> {
  key: K;
  label: { en: string; fr: string };
  options: Array<{ key: NonNullable<StyleAnswers[K]>; label: { en: string; fr: string } }>;
}

export const STYLE_QUESTIONS: StyleQuestion[] = [
  { key: 'use', label: { en: 'What are they for?', fr: 'Pour quel usage?' }, options: [
    { key: 'optical', label: { en: 'Prescription glasses', fr: 'Lunettes de vue' } },
    { key: 'sun', label: { en: 'Sunglasses', fr: 'Solaires' } },
  ] },
  { key: 'personality', label: { en: 'How do they want to feel in them?', fr: 'Quel effet recherchent-ils?' }, options: [
    { key: 'classic', label: { en: 'Classic', fr: 'Classique' } },
    { key: 'minimal', label: { en: 'Discreet', fr: 'Discret' } },
    { key: 'bold', label: { en: 'Statement', fr: 'Affirmé' } },
    { key: 'funky', label: { en: 'Funky', fr: 'Audacieux' } },
  ] },
  { key: 'size', label: { en: 'Size', fr: 'Taille' }, options: [
    { key: 'fitted', label: { en: 'Fitted', fr: 'Ajustée' } },
    { key: 'medium', label: { en: 'In between', fr: 'Moyenne' } },
    { key: 'oversized', label: { en: 'Oversized', fr: 'Oversize' } },
  ] },
  { key: 'shape', label: { en: 'Shape', fr: 'Forme' }, options: [
    { key: 'round', label: { en: 'Round', fr: 'Ronde' } },
    { key: 'square', label: { en: 'Square', fr: 'Carrée' } },
    { key: 'cat_eye', label: { en: 'Cat-eye', fr: 'Papillon' } },
    { key: 'aviator', label: { en: 'Aviator', fr: 'Aviateur' } },
    { key: 'any', label: { en: 'Open to anything', fr: 'Ouvert à tout' } },
  ] },
  { key: 'tone', label: { en: 'Colour', fr: 'Couleur' }, options: [
    { key: 'black', label: { en: 'Black', fr: 'Noir' } },
    { key: 'tortoise', label: { en: 'Tortoise', fr: 'Écaille' } },
    { key: 'colour', label: { en: 'Colour', fr: 'Couleur' } },
    { key: 'clear', label: { en: 'Clear / light', fr: 'Transparent / clair' } },
    { key: 'any', label: { en: 'Open to anything', fr: 'Ouvert à tout' } },
  ] },
];

/** Store rules: when every listed answer matches, these frame families come first. Seren to confirm/extend. */
export interface NamedPick {
  when: Partial<StyleAnswers>;
  families: string[];
  why: { en: string; fr: string };
}

export const NAMED_PICKS: NamedPick[] = [
  { when: { personality: 'funky', size: 'oversized' }, families: ['June'], why: { en: 'Funky and oversized: June is the store’s go-to.', fr: 'Audacieux et oversize : June est la valeur sûre du magasin.' } },
];

const KEYWORDS: Record<string, string[]> = {
  'use:sun': ['sun', 'solaire', 'sunglass'],
  'personality:classic': ['classic', 'classique', 'heritage'],
  'personality:minimal': ['minimal', 'thin', 'metal', 'titanium', 'rimless'],
  'personality:bold': ['bold', 'thick', 'acetate', 'statement'],
  'personality:funky': ['funky', 'colour', 'color', 'pattern', 'crystal'],
  'size:oversized': ['oversized', 'large', 'xl'],
  'size:fitted': ['small', 'narrow', 'petite'],
  'shape:round': ['round', 'ronde', 'panto'],
  'shape:square': ['square', 'carrée', 'rectangle', 'rectangular'],
  'shape:cat_eye': ['cat', 'cat-eye', 'papillon', 'butterfly'],
  'shape:aviator': ['aviator', 'pilot', 'aviateur'],
  'tone:black': ['black', 'noir'],
  'tone:tortoise': ['tortoise', 'havana', 'écaille', 'tort'],
  'tone:colour': ['blue', 'red', 'green', 'crimson', 'pink', 'yellow', 'bleu', 'rouge', 'vert'],
  'tone:clear': ['clear', 'crystal', 'transparent', 'champagne'],
};

export function namedPicks(a: StyleAnswers): NamedPick[] {
  return NAMED_PICKS.filter((p) => Object.entries(p.when).every(([k, v]) => a[k as keyof StyleAnswers] === v));
}

interface ScorableProduct { title: unknown; tags?: string[]; productType?: string | null; category?: string | null }

function haystack(p: ScorableProduct): string {
  const title = typeof p.title === 'string' ? p.title : Object.values((p.title as Record<string, string>) ?? {}).join(' ');
  return [title, ...(p.tags ?? []), p.productType ?? '', p.category ?? ''].join(' ').toLowerCase();
}

/** Higher is a better match. Named-pick families get a large boost. */
export function scoreProduct(p: ScorableProduct, a: StyleAnswers, picks: NamedPick[] = namedPicks(a)): number {
  const h = haystack(p);
  let score = 0;
  for (const pick of picks) for (const f of pick.families) if (h.includes(f.toLowerCase())) score += 100;
  for (const [k, v] of Object.entries(a)) {
    if (!v || v === 'any') continue;
    for (const word of KEYWORDS[`${k}:${v}`] ?? []) if (h.includes(word)) { score += 10; break; }
  }
  // Sunglasses asked for: optical-only frames sink; and the other way round.
  const isSun = /\bsun|solaire/.test(h);
  if (a.use === 'sun' && !isSun) score -= 5;
  if (a.use === 'optical' && isSun) score -= 5;
  return score;
}

export function rankProducts<P extends ScorableProduct>(products: P[], a: StyleAnswers): Array<{ product: P; score: number }> {
  const picks = namedPicks(a);
  return products
    .map((product) => ({ product, score: scoreProduct(product, a, picks) }))
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score);
}

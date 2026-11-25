// Configurator types — mirrors Foundry's snapshot/resolve API shapes

export interface ConfiguratorResolveResult {
  channels: ResolvedChannel[];
}

export interface ResolvedChannel {
  flowId: string;
  flowName: { en: string; fr?: string };
  channelId: string;
}

// Snapshot blob returned by GET /api/storefront/configurator/snapshot?flowId=
export interface ConfiguratorSnapshot {
  flow: {
    id: string;
    name: { en: string; fr?: string };
  };
  steps: SnapshotStep[];
  priceRules?: SnapshotPriceRule[];
  /** Show a step, group or choice only when earlier picks match (Foundry storefront/evaluator.ts). */
  conditionSets?: SnapshotConditionSet[];
}

export interface SnapshotConditionSet {
  id: string;
  targetType: 'step' | 'choice_group' | 'choice' | string;
  targetId: string;
  logic: 'all' | 'any';
  /** field: a group id or code; value: a choice id or code. */
  conditions: { field: string; operator: string; value: unknown }[];
}

export interface SnapshotStep {
  id: string;
  name: { en: string; fr?: string };
  description?: { en?: string; fr?: string } | null;
  sortOrder: number;
  groups: SnapshotGroup[];
}

export interface SnapshotGroup {
  id: string;
  code: string;
  label: { en: string; fr?: string };
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
  sortOrder: number;
  displayStyle?: string | null;
  choices: SnapshotChoice[];
}

export interface SnapshotChoice {
  id: string;
  code: string;
  label: { en: string; fr?: string };
  description?: { en?: string; fr?: string } | null;
  choiceType: 'standard' | 'product' | 'colour' | 'content' | 'link' | 'input';
  priceDelta: number; // cents — the choice's price when no price rule overrides it
  /** Shown but not orderable yet (live: prescription lens types). */
  comingSoon?: boolean;
  badge?: { en?: string; fr?: string } | string | null;
  helpText?: { en?: string; fr?: string } | null;
  /** Words for a `content` choice. */
  contentBody?: { en?: string; fr?: string } | string | null;
  /** Where a `link` choice goes (e.g. book an appointment). */
  link?: string | { url?: string } | null;
  imageUrl?: string | null;
  shopifyProductId: string | null;
  lensColourSetId: string | null;
  sortOrder: number;
  groupId: string;
}

export interface SnapshotPriceRule {
  ownerId: string;
  amount: number | null; // cents
  label: string | null;
  ruleType: string;
}

// Lens colour reference data
export interface LensColour {
  id: string;
  code: string;
  /** Foundry returns Bilingual ({en, fr}) — resolve before rendering */
  label: string | { en: string; fr?: string };
  /** Foundry sends `hexCode`; normaliseLensColour copies it here. */
  hexStart: string;
  hexCode?: string;
  hexEnd?: string | null; // null = solid, string = gradient
  imageUrl?: string | null;
  price: number; // cents
  category: string;
  status: 'active' | 'discontinued';
  setName: string;
}

/** Resolve a lens colour label to a display string */
export function resolveLensColourLabel(label: LensColour['label']): string {
  if (typeof label === 'string') return label;
  return label.en ?? label.fr ?? '';
}

export interface LensColourSet {
  setName: string;
  colours: LensColour[];
}

// Serialized cart output
export interface CartResult {
  attributes: CartLineAttribute[];
  addonLines: AddonLine[];
  pricingLines: PricingLine[];
}

export interface CartLineAttribute {
  key: string;
  value: string;
}

export interface AddonLine {
  variantId: string;
  quantity: number;
  attributes: CartLineAttribute[];
}

export interface PricingLine {
  code: string;
  label: string;
  amount: number; // cents
}

// Selections state: groupId → choiceId[]
export type ConfiguratorSelections = Record<string, string[]>;

// Colour selections: composite key `groupId:choiceId:colour` → lensColourId
export type ColourSelections = Record<string, string>;

// Computed totals
export interface ConfiguratorPriceSummary {
  basePrice: number;    // cents — from product variant
  addons: number;       // cents — sum of pricingLines
  total: number;        // cents
  pricingLines: PricingLine[];
}

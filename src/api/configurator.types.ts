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
  choices: SnapshotChoice[];
}

export interface SnapshotChoice {
  id: string;
  code: string;
  label: { en: string; fr?: string };
  description?: { en?: string; fr?: string } | null;
  choiceType: 'standard' | 'product' | 'colour' | 'content';
  priceDelta: number; // cents
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
  label: string;
  hexStart: string;
  hexEnd?: string | null; // null = solid, string = gradient
  price: number; // cents
  category: string;
  status: 'active' | 'discontinued';
  setName: string;
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

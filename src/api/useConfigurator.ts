import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type {
  ConfiguratorResolveResult,
  ConfiguratorSnapshot,
  LensColour,
  CartResult,
  CartLineAttribute,
  AddonLine,
  PricingLine,
  ConfiguratorSelections,
  ColourSelections,
} from './configurator.types';
import type { SnapshotGroup, SnapshotChoice, SnapshotPriceRule } from './configurator.types';

// --- Query hooks ---

/**
 * Resolve which configurator flows apply to a product.
 * Returns empty channels if this product has no configurator.
 */
export function useConfiguratorResolve(productId: string | null) {
  return useQuery({
    queryKey: ['configurator', 'resolve', productId],
    queryFn: () =>
      api.get<ConfiguratorResolveResult>('/api/storefront/configurator/resolve', {
        params: { productId: productId! },
      }),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 min — flows don't change often
  });
}

/**
 * Load the published flow snapshot for a specific flow ID.
 * This contains the full step/group/choice tree.
 */
export function useConfiguratorSnapshot(flowId: string | null) {
  return useQuery({
    queryKey: ['configurator', 'snapshot', flowId],
    queryFn: () =>
      api.get<ConfiguratorSnapshot>('/api/storefront/configurator/snapshot', {
        params: { flowId: flowId! },
      }),
    enabled: !!flowId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Lens colours reference data — all available colours.
 */
export function useLensColours() {
  return useQuery({
    queryKey: ['configurator', 'lens-colours'],
    queryFn: () => api.get<LensColour[]>('/api/storefront/configurator/lens-colours'),
    staleTime: 30 * 60 * 1000, // 30 min — reference data
  });
}

// --- Serializer (client-side, mirrors Foundry's serialize-flow.ts) ---

/**
 * Converts configurator selections to cart attributes + addon lines.
 * Mirrors the logic in Foundry's serialize-flow.ts so we don't round-trip
 * to the server just to compute the cart result.
 */
export function serializeSelections(
  selections: ConfiguratorSelections,
  groups: SnapshotGroup[],
  choices: SnapshotChoice[],
  priceRules: SnapshotPriceRule[],
  lensColours: LensColour[],
  colourSelections: ColourSelections,
): CartResult {
  const attributes: CartLineAttribute[] = [];
  const addonLines: AddonLine[] = [];
  const pricingLines: PricingLine[] = [];

  const choiceMap = new Map(choices.map((c) => [c.id, c]));
  const priceMap = new Map(priceRules.map((r) => [r.ownerId, r]));
  const colourMap = new Map(lensColours.map((c) => [c.id, c]));

  for (const group of groups) {
    const selectedIds = selections[group.id];
    if (!selectedIds?.length) continue;

    const standardCodes: string[] = [];

    for (const choiceId of selectedIds) {
      const choice = choiceMap.get(choiceId);
      if (!choice) continue;

      // Content choices: no cart output
      if (choice.choiceType === 'content') continue;

      // Product choices: addon line
      if (choice.choiceType === 'product') {
        if (!choice.shopifyProductId) continue;
        const gid = choice.shopifyProductId.startsWith('gid://')
          ? choice.shopifyProductId
          : `gid://shopify/ProductVariant/${choice.shopifyProductId}`;
        addonLines.push({
          variantId: gid,
          quantity: 1,
          attributes: [
            { key: '_addon', value: 'true' },
            { key: '_addonLabel', value: choice.label?.en ?? choice.code },
          ],
        });
        const rule = priceMap.get(choiceId);
        if (rule?.amount && rule.amount > 0) {
          pricingLines.push({
            code: choice.code,
            label: rule.label || choice.label?.en || choice.code,
            amount: rule.amount,
          });
        }
        continue;
      }

      // Colour choices
      if (choice.choiceType === 'colour') {
        const colourSelKey = `${group.id}:${choiceId}:colour`;
        const colourId = colourSelections[colourSelKey];
        const colour = colourId ? colourMap.get(colourId) : null;
        attributes.push({ key: `_${group.code}`, value: choice.code });
        if (colour) {
          attributes.push({ key: `_${group.code}_colour`, value: colour.code });
          attributes.push({ key: `_${group.code}_colour_label`, value: colour.label });
          if (colour.price > 0) {
            pricingLines.push({
              code: colour.code,
              label: `${choice.label?.en ?? choice.code}: ${colour.label}`,
              amount: colour.price,
            });
          }
        }
        continue;
      }

      // Standard choices
      standardCodes.push(choice.code);
      const rule = priceMap.get(choiceId);
      if (rule?.amount && rule.amount > 0) {
        pricingLines.push({
          code: choice.code,
          label: rule.label || choice.label?.en || choice.code,
          amount: rule.amount,
        });
      }
    }

    if (standardCodes.length) {
      attributes.push({ key: `_${group.code}`, value: standardCodes.join(',') });
    }
  }

  return { attributes, addonLines, pricingLines };
}

/**
 * Check if all required groups in the current step have a selection.
 */
export function isStepComplete(
  groups: SnapshotGroup[],
  selections: ConfiguratorSelections,
): boolean {
  return groups
    .filter((g) => g.isRequired)
    .every((g) => (selections[g.id]?.length ?? 0) > 0);
}

/**
 * Compute total price delta from selections.
 */
export function computePriceDelta(
  selections: ConfiguratorSelections,
  choices: SnapshotChoice[],
  priceRules: SnapshotPriceRule[],
  lensColours: LensColour[],
  colourSelections: ColourSelections,
): number {
  const choiceMap = new Map(choices.map((c) => [c.id, c]));
  const priceMap = new Map(priceRules.map((r) => [r.ownerId, r]));
  const colourMap = new Map(lensColours.map((c) => [c.id, c]));

  let delta = 0;

  for (const selectedIds of Object.values(selections)) {
    for (const choiceId of selectedIds) {
      const choice = choiceMap.get(choiceId);
      if (!choice) continue;

      if (choice.choiceType === 'colour') {
        const colourSelKey = Object.entries(colourSelections).find(
          ([k]) => k.includes(choiceId),
        );
        if (colourSelKey) {
          const colour = colourMap.get(colourSelKey[1]);
          if (colour) delta += colour.price;
        }
      } else {
        const rule = priceMap.get(choiceId);
        if (rule?.amount) delta += rule.amount;
      }
    }
  }

  return delta;
}

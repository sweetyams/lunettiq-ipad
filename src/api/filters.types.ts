/**
 * Filter types — matches Foundry GET /api/storefront/filters response.
 * Used for faceted product navigation (colour swatches, material, shape, etc.)
 */

export interface FilterValue {
  id: string;
  value: string;
  label: Record<string, string>;
  swatchHex: string | null;
}

export interface FilterGroup {
  id: string;
  code: string;
  label: Record<string, string>;
  displayType: 'text' | 'swatch' | 'range';
  values: FilterValue[];
}

/** Per-product filter assignments: productId → { groupCode: [values] } */
export type ProductFilterMap = Record<string, Record<string, string[]>>;

export interface FiltersResponse {
  groups: FilterGroup[];
  products: ProductFilterMap;
}

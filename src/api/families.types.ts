/**
 * Product Family types — matches Foundry storefront product-families endpoints.
 * Used for colour/type variant switching on product detail.
 */

export interface ProductSibling {
  colour: string | null;
  colourHex: string | null;
  /** Second tone for a two-tone swatch (tortoise: brown + black). */
  colourHex2?: string | null;
  swatchType?: 'solid' | '2-tone' | 'image' | string | null;
  swatchImage?: string | null;
  type: string | null;
  handle: string;
  title: string;
  shopifyId: string;
  image: string | null;
  sortOrder: number;
}

export interface ProductFamilyResponse {
  familyId: string | null;
  familyName: string | null;
  siblings: ProductSibling[];
}

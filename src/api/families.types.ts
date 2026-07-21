/**
 * Product Family types — matches Foundry storefront product-families endpoints.
 * Used for colour/type variant switching on product detail.
 */

export interface ProductSibling {
  colour: string | null;
  colourHex: string | null;
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

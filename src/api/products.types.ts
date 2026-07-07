/**
 * Product types — matches Foundry API response shape.
 * Source: shopifyProducts + shopifyVariants + productContent tables.
 */

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  shopifyId: string;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  imageUrl: string | null;
  inventoryQuantity?: number;
}

export interface Product {
  shopifyId: string;
  handle: string;
  title: string;
  description: string | null;
  vendor: string | null;
  tags: string[];
  status: string;
  images: ProductImage[];
  priceMin: string | null;
  priceMax: string | null;
  variantCount: number;
  metafields?: Record<string, unknown>;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  content?: {
    title: { en: string; fr: string };
    description: { en: string; fr: string };
    shortCardCopy?: { en: string; fr: string };
  };
}

export interface ProductListParams {
  q?: string;
  type?: string;
  vendor?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

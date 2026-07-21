/**
 * Product types — matches Foundry API response shape.
 * Source: canonical_products + product_variants + product_content tables.
 */

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductViewHints {
  hasImage: boolean;
  syncStatus: 'linked' | 'local' | 'not_linked';
  stockBucket: 'in' | 'low' | 'out';
}

export interface ProductVariant {
  shopifyId: string;
  title: string | null;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  imageUrl: string | null;
  inventoryQuantity?: number;
}

export interface Product {
  id: string;
  shopifyId: string;
  handle: string;
  title: Record<string, string> | string;
  description?: Record<string, string> | string | null;
  vendor: string | null;
  tags: string[];
  status: string;
  origin?: string;
  category?: string | null;
  productType?: string | null;
  images: ProductImage[];
  priceMin: string | null;
  priceMax: string | null;
  variantCount: number;
  totalStock: number;
  viewHints: ProductViewHints;
  metafields?: Record<string, unknown>;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  content?: {
    title: { en: string; fr?: string };
    description: { en: string; fr?: string };
    shortCardCopy?: { en: string; fr?: string };
  };
  taxable?: boolean;
  publishedAt?: string | null;
}

export interface ProductListParams {
  q?: string;
  type?: string;
  vendor?: string;
  status?: string;
  stock?: 'in' | 'low' | 'out';
  collection?: string;
  limit?: number;
  offset?: number;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ProductDetailResponse {
  data: ProductDetail;
}

// --- Suggestions (scored recommendations) ---

export interface ScoredProduct {
  productId: string;
  handle: string | null;
  title: Record<string, string>;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  vendor: string | null;
  tags: string[];
  score: number;
  matchReasons: string[];
}

export interface SuggestionsResponse {
  data: ScoredProduct[];
  meta: {
    total: number;
    limit: number;
  };
}

// --- Product Interactions ---

export type ProductInteractionType = 'viewed' | 'tried_on' | 'liked' | 'disliked' | 'saved' | 'shared' | 'purchased' | 'recommended';

export interface CreateProductInteractionParams {
  productId: string;
  variantId?: string | null;
  type: ProductInteractionType;
  source: 'tablet';
  sessionId?: string | null;
  locationId?: string | null;
  staffId?: string | null;
}

export interface ProductInteraction {
  id: string;
  shopifyCustomerId: string;
  productId: string;
  variantId: string | null;
  type: ProductInteractionType;
  source: string;
  sessionId: string | null;
  locationId: string | null;
  staffId: string | null;
  occurredAt: string;
}

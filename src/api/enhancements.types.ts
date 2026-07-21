/**
 * Product Enhancement types — matches Foundry GET /api/product-enhancements/{productId}.
 * Bilingual editorial content layered on top of Shopify product data.
 */

export interface ProductEnhancement {
  id: string;
  projectId: string;
  shopifyProductId: string;
  longDescription: Record<string, string>;
  story: Record<string, string>;
  fittingGuidance: Record<string, string>;
  bodySections: BodySection[];
  updatedAt: string;
}

export interface BodySection {
  type: string;
  title?: Record<string, string>;
  content?: Record<string, string>;
  [key: string]: unknown;
}

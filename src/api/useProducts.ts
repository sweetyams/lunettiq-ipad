import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Product, ProductDetail, ProductListParams, ProductListResponse, ProductDetailResponse, ProductImage } from './products.types';

/**
 * Normalize image objects that may have `src` (Shopify legacy) instead of `url`.
 * Also handles cases where images is a flat string array.
 */
function normalizeImages(images: unknown): ProductImage[] {
  if (!images || !Array.isArray(images)) return [];
  return images
    .map((img: unknown) => {
      if (typeof img === 'string') return { url: img };
      if (typeof img === 'object' && img !== null) {
        const obj = img as Record<string, unknown>;
        const url = (obj.url ?? obj.src) as string | undefined;
        if (!url) return null;
        return { url, alt: (obj.alt ?? obj.altText) as string | undefined };
      }
      return null;
    })
    .filter((img): img is ProductImage => img !== null && !!img.url);
}

/** Normalize a single product's images + variant imageUrls */
function normalizeProduct<T extends { images?: unknown; variants?: unknown[] }>(p: T): T {
  const normalized = { ...p };
  (normalized as any).images = normalizeImages(p.images);
  if (Array.isArray(p.variants)) {
    (normalized as any).variants = p.variants.map((v: any) => ({
      ...v,
      // Ensure variant imageUrl is a string or null
      imageUrl: v.imageUrl ?? v.image_url ?? null,
    }));
  }
  return normalized;
}

export function useProducts(params?: ProductListParams) {
  const searchParams: Record<string, string> = {};
  if (params?.q) searchParams.q = params.q;
  if (params?.type) searchParams.type = params.type;
  if (params?.vendor) searchParams.vendor = params.vendor;
  if (params?.status) searchParams.status = params.status;
  if (params?.stock) searchParams.stock = params.stock;
  if (params?.collection) searchParams.collection = params.collection;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);

  return useQuery({
    queryKey: ['products', params],
    queryFn: async (): Promise<ProductListResponse> => {
      // The Foundry products endpoint returns { data: Product[], meta: { total, limit, offset } }
      // The API client unwraps this by returning json.data (just the array).
      // We need the full response with meta, so we handle both shapes:
      const result = await api.get<Product[] | ProductListResponse>('/api/storefront/products', { params: searchParams });

      // If the client already unwrapped → result is Product[]
      if (Array.isArray(result)) {
        return {
          data: result.map(normalizeProduct),
          meta: {
            total: result.length,
            limit: Number(searchParams.limit) || 50,
            offset: Number(searchParams.offset) || 0,
          },
        };
      }

      // If result came through with data+meta intact (shouldn't happen with current client but safe)
      if (result && 'data' in result && Array.isArray((result as ProductListResponse).data)) {
        const r = result as ProductListResponse;
        return { ...r, data: r.data.map(normalizeProduct) };
      }

      // Fallback
      return { data: [], meta: { total: 0, limit: 50, offset: 0 } };
    },
    staleTime: 10 * 60 * 1000, // 10 min — catalogue is stable
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async (): Promise<ProductDetail> => {
      // Product detail returns { data: { id, title, variants, ... } }
      // After client unwrap, we get the product object directly (json.data → the object inside)
      const result = await api.get<ProductDetail>(`/api/storefront/products/${id}`);
      return normalizeProduct(result);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

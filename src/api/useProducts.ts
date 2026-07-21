import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Product, ProductDetail, ProductListParams, ProductListResponse, ProductDetailResponse } from './products.types';

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
          data: result,
          meta: {
            total: result.length,
            limit: Number(searchParams.limit) || 50,
            offset: Number(searchParams.offset) || 0,
          },
        };
      }

      // If result came through with data+meta intact (shouldn't happen with current client but safe)
      if (result && 'data' in result && Array.isArray((result as ProductListResponse).data)) {
        return result as ProductListResponse;
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
      return result;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { Product, ProductDetail, ProductListParams } from './products.types';

export function useProducts(params?: ProductListParams) {
  const searchParams: Record<string, string> = {};
  if (params?.q) searchParams.q = params.q;
  if (params?.type) searchParams.type = params.type;
  if (params?.vendor) searchParams.vendor = params.vendor;
  if (params?.status) searchParams.status = params.status;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);

  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get<Product[]>('/api/admin/products', { params: searchParams }),
    staleTime: 10 * 60 * 1000, // 10 min — catalogue is stable
  });
}

export function useProduct(shopifyId: string) {
  return useQuery({
    queryKey: ['products', shopifyId],
    queryFn: () => api.get<ProductDetail>(`/api/admin/products/${shopifyId}`),
    enabled: !!shopifyId,
    staleTime: 5 * 60 * 1000,
  });
}

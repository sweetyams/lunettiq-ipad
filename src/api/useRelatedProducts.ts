import { useQuery } from '@tanstack/react-query';
import { api } from './client';

/** A frame lunettiq.com lists under "Related products" (GET /api/storefront/related-products?handle=). */
export interface RelatedProduct {
  id: string;
  handle: string;
  title: { en?: string; fr?: string } | string;
  image: string | null;
  /** cents */
  price: number | null;
  score?: number;
  /** "Same shape", "Same material", "Similar size"… */
  matchReasons?: string[];
}

export function useRelatedProducts(handle: string | null | undefined) {
  return useQuery({
    queryKey: ['storefront', 'related-products', handle],
    queryFn: async () => (await api.get<RelatedProduct[] | null>('/api/storefront/related-products', { params: { handle: handle! } })) ?? [],
    enabled: !!handle,
    staleTime: 10 * 60 * 1000,
  });
}

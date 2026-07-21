import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ProductFamilyResponse } from './families.types';

/**
 * Fetch colour/type siblings for a product from its family.
 * GET /api/storefront/product-families/by-product/{productId}
 *
 * Powers the colour switcher on product detail (PRD-02).
 */
export function useProductFamily(productId: string | null) {
  return useQuery({
    queryKey: ['product-families', productId],
    queryFn: async (): Promise<ProductFamilyResponse> => {
      const result = await api.get<ProductFamilyResponse>(
        `/api/storefront/product-families/by-product/${productId}`
      );
      return result;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 min — families are stable
  });
}

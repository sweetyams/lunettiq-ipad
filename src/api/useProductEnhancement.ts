import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ProductEnhancement } from './enhancements.types';

/**
 * Fetch product enhancement (editorial content) for a product.
 * GET /api/product-enhancements/{productId}
 *
 * Returns bilingual long description, brand story, fitting guidance.
 * Used on PRD-02 to give SA talking points during consultation.
 */
export function useProductEnhancement(productId: string | null) {
  return useQuery({
    queryKey: ['product-enhancements', productId],
    queryFn: async (): Promise<ProductEnhancement | null> => {
      const result = await api.get<ProductEnhancement | null>(
        `/api/product-enhancements/${productId}`
      );
      return result;
    },
    enabled: !!productId,
    staleTime: 15 * 60 * 1000, // 15 min — editorial content is stable
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { FiltersResponse } from './filters.types';

/**
 * Fetch product filter taxonomy (colour, material, shape, etc.)
 * from GET /api/storefront/filters.
 *
 * Returns filter groups with values and a product→filter mapping.
 * Cached aggressively — filters rarely change.
 */
export function useFilters() {
  return useQuery({
    queryKey: ['filters'],
    queryFn: async (): Promise<FiltersResponse> => {
      // api.get() unwraps the Foundry envelope: { data: { groups, products } }
      // We receive the inner { groups, products } object directly
      const result = await api.get<FiltersResponse>('/api/storefront/filters');
      return result;
    },
    staleTime: 30 * 60 * 1000, // 30 min — filter taxonomy is stable
  });
}

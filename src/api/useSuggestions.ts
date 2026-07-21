import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ScoredProduct, SuggestionsResponse } from './products.types';

interface UseSuggestionsOptions {
  limit?: number;
}

export function useSuggestions(clientId: string | null, options?: UseSuggestionsOptions) {
  const limit = options?.limit ?? 50;

  return useQuery({
    queryKey: ['suggestions', clientId, { limit }],
    queryFn: async (): Promise<ScoredProduct[]> => {
      const result = await api.get<SuggestionsResponse>(
        `/api/clients/${clientId}/suggestions`,
        { params: { limit: String(limit) } }
      );
      return result.data;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 min — suggestions can change with interactions
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import type { ScoredProduct } from './products.types';

interface UseSuggestionsOptions {
  limit?: number;
}

export function useSuggestions(clientId: string | null, options?: UseSuggestionsOptions) {
  const limit = options?.limit ?? 50;

  return useQuery({
    queryKey: ['suggestions', clientId, { limit }],
    queryFn: async (): Promise<ScoredProduct[]> => {
      // api.get() already unwraps the Foundry { data, error, meta } envelope
      // The endpoint returns ScoredProduct[] as the data payload directly
      const result = await api.get<ScoredProduct[]>(
        `/api/clients/${clientId}/suggestions`,
        { params: { limit: String(limit) } }
      );
      return result;
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000, // 2 min — suggestions can change with interactions
  });
}

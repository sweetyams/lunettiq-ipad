import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientListResponse, ClientProfile } from './clients.types';
import { duplicateSearchTerms, findLikelyDuplicates, type DuplicateCheckParams } from './duplicateCheck';

interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'fr';
  notes?: string;
}

export type { DuplicateCheckParams, DuplicateClient } from './duplicateCheck';

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientData) => 
      api.post<ClientProfile>('/api/clients', data),
    onSuccess: (newClient) => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Add to cache
      queryClient.setQueryData(['clients', newClient.id], newClient);
    },
  });
}

/**
 * Imperative duplicate check for the New client form. Foundry has no
 * duplicates endpoint (`/api/clients/duplicates` hits `[id]` and 500s), so
 * this searches the client list and matches locally.
 */
export function useTriggerDuplicateCheck() {
  const queryClient = useQueryClient();
  return useCallback((params: DuplicateCheckParams) =>
    queryClient.fetchQuery({
      queryKey: ['clients', 'duplicates', params],
      queryFn: async () => {
        const terms = duplicateSearchTerms(params);
        const pages = await Promise.all(terms.map((q) =>
          api.get<ClientListResponse>('/api/clients', { params: { q, limit: '20' } }).catch(() => ({ clients: [] as Client[], total: 0 }))));
        const duplicates = findLikelyDuplicates(params, pages.flatMap((p) => p?.clients ?? []));
        return { duplicates, total: duplicates.length };
      },
      staleTime: 30_000,
    }), [queryClient]);
}

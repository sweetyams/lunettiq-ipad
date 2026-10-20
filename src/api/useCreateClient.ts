import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientListResponse, ClientProfile } from './clients.types';
import { duplicateSearchTerms, findLikelyDuplicates, type DuplicateCheckParams, type DuplicateClient } from './duplicateCheck';

interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'fr';
  notes?: string;
  /** Create even though Foundry found a client with this email/phone (409 DUPLICATE). */
  force?: boolean;
}

export type { DuplicateCheckParams, DuplicateClient } from './duplicateCheck';
export { duplicatesFromError } from './duplicateCheck';

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
 * Imperative duplicate check for the New client form. Uses Foundry's
 * `GET /api/clients/duplicates?firstName&lastName&email&phone` when it answers
 * `{ duplicates }` (branch fix/ipad-v2-api-gaps); older servers route that path
 * elsewhere, so fall back to searching the client list and matching locally.
 */
export function useTriggerDuplicateCheck() {
  const queryClient = useQueryClient();
  return useCallback((params: DuplicateCheckParams) =>
    queryClient.fetchQuery({
      queryKey: ['clients', 'duplicates', params],
      queryFn: async () => {
        const query: Record<string, string> = {};
        for (const [k, v] of Object.entries(params)) if (v) query[k] = v;
        const server = await api.get<{ duplicates?: DuplicateClient[] }>('/api/clients/duplicates', { params: query }).catch(() => null);
        if (server && Array.isArray(server.duplicates)) {
          return { duplicates: server.duplicates, total: server.duplicates.length };
        }
        const terms = duplicateSearchTerms(params);
        const pages = await Promise.all(terms.map((q) =>
          api.get<ClientListResponse>('/api/clients', { params: { q, limit: '20' } }).catch(() => ({ clients: [] as Client[], total: 0 }))));
        const duplicates = findLikelyDuplicates(params, pages.flatMap((p) => p?.clients ?? []));
        return { duplicates, total: duplicates.length };
      },
      staleTime: 30_000,
    }), [queryClient]);
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientProfile, ClientListResponse, ClientSearchParams } from './clients.types';

export function useClients(params?: ClientSearchParams) {
  const searchParams: Record<string, string> = {};
  if (params?.q) searchParams.q = params.q;
  if (params?.sort) searchParams.sort = params.sort;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.get<ClientListResponse>('/api/clients', { params: searchParams }),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch the 5 most recently updated clients */
export function useRecentClients() {
  return useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: () =>
      api.get<ClientListResponse>('/api/clients', {
        params: { sort: 'updatedAt', limit: '5' },
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get<ClientProfile>(`/api/clients/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<unknown>(`/api/clients/${id}/enrichment`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}

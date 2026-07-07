import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientProfile, ClientListResponse, ClientSearchParams } from './clients.types';

export function useClients(params?: ClientSearchParams) {
  const searchParams: Record<string, string> = {};
  if (params?.q) searchParams.q = params.q;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.get<ClientListResponse>('/api/admin/clients', { params: searchParams }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(shopifyId: string) {
  return useQuery({
    queryKey: ['clients', shopifyId],
    queryFn: () => api.get<ClientProfile>(`/api/admin/clients/${shopifyId}`),
    enabled: !!shopifyId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shopifyId, data }: { shopifyId: string; data: Record<string, unknown> }) =>
      api.patch<unknown>(`/api/admin/clients/${shopifyId}/enrichment`, data),
    onSuccess: (_, { shopifyId }) => {
      qc.invalidateQueries({ queryKey: ['clients', shopifyId] });
    },
  });
}

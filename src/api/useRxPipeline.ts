import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { RxOrder, RxPipelineCounts, CreateRxOrderPayload, UpdateRxOrderPayload } from './rx-pipeline.types';

export function useRxPipelineOrders(params?: { state?: string; clientId?: string; limit?: number; offset?: number }) {
  // Convert to string params, filtering out undefined values
  const apiParams = params ? Object.fromEntries(
    Object.entries({
      state: params.state,
      clientId: params.clientId,
      limit: params.limit?.toString(),
      offset: params.offset?.toString(),
    }).filter(([_, value]) => value !== undefined)
  ) as Record<string, string> : undefined;

  return useQuery({
    queryKey: ['rx-pipeline', 'orders', params],
    queryFn: () => api.get<RxOrder[]>('/api/admin/rx-pipeline/orders', { params: apiParams }),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRxPipelineOrder(id: string) {
  return useQuery({
    queryKey: ['rx-pipeline', 'orders', id],
    queryFn: () => api.get<RxOrder>(`/api/admin/rx-pipeline/orders/${id}`),
    enabled: !!id,
  });
}

export function useRxPipelineCounts() {
  return useQuery({
    queryKey: ['rx-pipeline', 'counts'],
    queryFn: () => api.get<RxPipelineCounts>('/api/admin/rx-pipeline/counts'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateRxOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRxOrderPayload) =>
      api.post<RxOrder>('/api/admin/rx-pipeline/orders', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rx-pipeline'] });
    },
  });
}

export function useUpdateRxOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRxOrderPayload & { id: string }) =>
      api.patch<RxOrder>(`/api/admin/rx-pipeline/orders/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rx-pipeline'] });
      qc.invalidateQueries({ queryKey: ['rx-pipeline', 'orders', id] });
    },
  });
}
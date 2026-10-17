import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { toRxOrderCreate, type RxOrderInput } from './rxOrderMapping';
import { toRxPipelineCounts } from './rxMapping';
import { toOrderItem, type FoundryRxOrderRow, type OrderItem } from './ordersMapping';
import type { RxOrder, RxPipelineCounts, UpdateRxOrderPayload } from './rx-pipeline.types';

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

/** Every Rx order mapped to the floor's five stages (Orders tab). */
export function useOrders() {
  return useQuery({
    queryKey: ['rx-pipeline', 'orders', 'mapped'],
    queryFn: async (): Promise<OrderItem[]> => {
      const rows = await api.get<FoundryRxOrderRow[]>('/api/admin/rx-pipeline/orders', { params: { limit: '500' } });
      const now = Date.now();
      return (Array.isArray(rows) ? rows : []).map((r) => toOrderItem(r, now));
    },
    staleTime: 60 * 1000,
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
    // 'mapped' keeps raw pre-mapping responses cached by older builds from being read
    queryKey: ['rx-pipeline', 'counts', 'mapped'],
    queryFn: async (): Promise<RxPipelineCounts> => toRxPipelineCounts(await api.get<unknown>('/api/admin/rx-pipeline/counts')),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateRxOrder() {
  const qc = useQueryClient();
  return useMutation({
    // Foundry requires customerId (Zod); sending clientId failed every order.
    mutationFn: (input: RxOrderInput) =>
      api.post<RxOrder>('/api/admin/rx-pipeline/orders', toRxOrderCreate(input)),
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
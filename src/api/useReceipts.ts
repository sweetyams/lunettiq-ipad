import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Receipt, SendReceiptPayload } from './receipts.types';

export function useReceipts(customerId: string) {
  return useQuery({
    queryKey: ['receipts', { customerId }],
    queryFn: () => api.get<Receipt[]>('/api/admin/receipts', { params: { customerId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!customerId,
  });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: ['receipts', id],
    queryFn: () => api.get<Receipt>(`/api/admin/receipts/${id}`),
    enabled: !!id,
  });
}

export function useSendReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: SendReceiptPayload }) =>
      api.post<void>(`/api/admin/receipts/${id}/send`, payload ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function useRegenerateReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Receipt>(`/api/admin/receipts/${id}/regenerate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
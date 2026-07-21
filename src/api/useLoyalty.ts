import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { LoyaltyBalance, IssueCreditPayload } from './loyalty.types';

export function useLoyaltyBalance(customerId: string) {
  return useQuery({
    queryKey: ['loyalty', customerId],
    queryFn: () => api.get<LoyaltyBalance>(`/api/loyalty/credits/${customerId}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!customerId,
  });
}

export function useIssueCredit(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IssueCreditPayload) =>
      api.post<LoyaltyBalance>(`/api/loyalty/credits/${customerId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty', customerId] });
    },
  });
}
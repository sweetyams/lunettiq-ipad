import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Interaction, InteractionListResponse, CreateInteractionParams } from './interactions.types';

export function useInteractions(shopifyCustomerId: string) {
  return useQuery({
    queryKey: ['interactions', shopifyCustomerId],
    queryFn: () => 
      api.get<InteractionListResponse>('/api/admin/interactions', {
        params: { customerId: shopifyCustomerId }
      }),
    enabled: !!shopifyCustomerId,
    staleTime: 60 * 1000, // 1 minute - timeline changes frequently
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateInteractionParams) =>
      api.post<Interaction>('/api/admin/interactions', {
        ...params,
        surface: params.surface || 'tablet', // Default to tablet for iPad app
      }),
    onSuccess: (_, variables) => {
      // Invalidate the interactions list for this customer
      qc.invalidateQueries({ 
        queryKey: ['interactions', variables.shopifyCustomerId] 
      });
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Interaction, InteractionListResponse, CreateInteractionParams } from './interactions.types';

export function useInteractions(clientId: string) {
  return useQuery({
    queryKey: ['interactions', clientId],
    queryFn: () => 
      api.get<InteractionListResponse>(`/api/clients/${clientId}/interactions`),
    enabled: !!clientId,
    staleTime: 60 * 1000, // 1 minute - timeline changes frequently
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateInteractionParams) =>
      // Foundry reads type/direction/subject/body/metadata (crm interactionCreateSchema).
      // Sending only `notes` used to drop every note's text.
      api.post<Interaction>(`/api/clients/${params.clientId}/interactions`, {
        type: params.type,
        direction: params.direction ?? 'internal',
        subject: params.subject ?? null,
        body: params.body ?? params.notes ?? null,
        metadata: params.metadata,
        surface: params.surface || 'tablet',
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ 
        queryKey: ['interactions', variables.clientId] 
      });
    },
  });
}

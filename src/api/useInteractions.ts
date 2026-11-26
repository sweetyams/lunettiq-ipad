import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Interaction, InteractionListResponse, CreateInteractionParams } from './interactions.types';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { syncEngine } from '@/src/sync/SyncEngine';

/** Foundry reads type/direction/subject/body/metadata (crm interactionCreateSchema). */
export function toInteractionBody(params: CreateInteractionParams) {
  return {
    type: params.type,
    direction: params.direction ?? 'internal',
    subject: params.subject ?? null,
    // Sending only `notes` used to drop every note's text.
    body: params.body ?? params.notes ?? null,
    metadata: params.metadata,
    surface: params.surface || 'tablet',
  };
}

export function useInteractions(clientId: string) {
  return useQuery({
    queryKey: ['interactions', clientId],
    // Foundry returns a plain array (after the client unwraps { data }); History and Clinical read
    // `.interactions`, so every client's history looked empty. Both shapes are accepted.
    queryFn: async (): Promise<InteractionListResponse> => {
      const res = await api.get<InteractionListResponse | Interaction[]>(`/api/clients/${clientId}/interactions`);
      if (Array.isArray(res)) return { interactions: res, total: res.length } as InteractionListResponse;
      return res ?? ({ interactions: [], total: 0 } as unknown as InteractionListResponse);
    },
    enabled: !!clientId,
    staleTime: 60 * 1000, // 1 minute - timeline changes frequently
  });
}

/**
 * Add a note / interaction. Offline (or if the request fails to reach Foundry) the note
 * goes to the sync queue and is sent on reconnect — staff never retype a note.
 * Resolves `{ queued: true }` in that case.
 */
export function useCreateInteraction() {
  const qc = useQueryClient();
  const isOnline = useSyncStore((st) => st.isOnline);

  return useMutation({
    mutationFn: async (params: CreateInteractionParams): Promise<Interaction | { queued: true }> => {
      const endpoint = `/api/clients/${params.clientId}/interactions`;
      const body = toInteractionBody(params);
      const queue = async () => {
        const id = `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        await syncEngine.enqueue('create', 'interaction', id, endpoint, 'POST', body, 'normal');
        return { queued: true as const };
      };
      if (!isOnline) return queue();
      try {
        return await api.post<Interaction>(endpoint, body);
      } catch (e) {
        // Network failure (no HTTP status) → queue; a real 4xx/5xx answer is surfaced.
        if ((e as { status?: number })?.status === undefined && /network|fetch|timed? ?out/i.test(String((e as Error)?.message))) return queue();
        throw e;
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['interactions', variables.clientId] });
    },
  });
}

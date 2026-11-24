import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { sortFollowUps, toFollowUp, type FollowUp, type FoundryHotLeadRow } from './hotLeadsMapping';

/** The Smart Discounts call queue: open, day-3 and day-7 leads, most urgent first. */
export function useFollowUps() {
  return useQuery({
    queryKey: ['hot-leads', 'queue'],
    queryFn: async (): Promise<FollowUp[]> => {
      const rows = await api.get<FoundryHotLeadRow[]>('/api/admin/hot-leads/queue');
      const now = Date.now();
      return sortFollowUps((Array.isArray(rows) ? rows : []).map((r) => toFollowUp(r, now)));
    },
    staleTime: 60 * 1000,
  });
}

export type ContactOutcome = 'sent' | 'reached' | 'voicemail' | 'no_answer' | 'declined' | 'scheduled_callback' | 'converted';

/** Log a follow-up contact (`POST /api/admin/hot-leads/contacts`). Foundry only records it; the message is sent from the iPad's Messages/Mail. */
export function useLogFollowUpContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { opportunityId: string; type: 'email' | 'sms' | 'call' | 'in_person'; outcome: ContactOutcome; templateUsed?: string; notes?: string }) =>
      // No discount: the store stopped discounting (gap checklist, Nov 2026).
      api.post('/api/admin/hot-leads/contacts', { ...input, direction: 'outbound' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hot-leads'] });
    },
  });
}

/** Close a follow-up that's done (booked, bought, or not interested). */
export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/admin/hot-leads/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hot-leads'] }),
  });
}

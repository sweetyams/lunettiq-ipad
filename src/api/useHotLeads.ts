import { useQuery } from '@tanstack/react-query';
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

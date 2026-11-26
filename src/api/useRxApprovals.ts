import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { toApprovalSummary, toReviewItem, type FoundryApprovalRow, type ReviewItem } from './rxMapping';
import { lookupClientNames } from './clientNames';
import { toApprovalView, type ApprovalView, type ChecklistSection, type FoundryApprovalDetail } from './approvalDetail';
import type {
  RxApproval,
  ApprovalStatus,
  ApprovalSummary,
  ApprovalChecklist,
  ReadinessCheck,
  SubmitApprovalPayload,
  ReturnPayload,
  RejectPayload,
  SignOffPayload,
  CorrectionsPayload,
} from './rx-approvals.types';

export function useRxApprovalQueue(status?: ApprovalStatus) {
  return useQuery({
    queryKey: ['rx-approvals', 'queue', { status }],
    queryFn: () =>
      api.get<RxApproval[]>('/api/admin/rx-approvals', {
        params: status ? { status } : undefined,
      }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/** Optician inbox: requests for a status, mapped and with client names resolved. */
export function useReviewQueue(status: 'submitted' | 'in_review' | 'completed') {
  return useQuery({
    queryKey: ['rx-approvals', 'queue', 'mapped', status],
    queryFn: async (): Promise<ReviewItem[]> => {
      // Foundry filters one status per request. "Done" used to fetch 100 rows of any status and
      // filter here, so finished reviews past the newest 100 requests never showed.
      const statuses = status === 'completed' ? ['approved', 'rejected', 'returned'] : [status];
      const pages = await Promise.all(statuses.map((s) =>
        api.get<FoundryApprovalRow[]>('/api/admin/rx-approvals', { params: { status: s, limit: '100' } })));
      const list = pages.flatMap((rows) => (Array.isArray(rows) ? rows : []));
      const names = await lookupClientNames(list.filter((r) => !r.snapshot?.clientName).map((r) => r.clientId));
      const now = Date.now();
      // Oldest first: the client who has waited longest is reviewed first.
      return list.map((r) => toReviewItem(r, names, now)).sort((a, b) => b.minutesWaiting - a.minutesWaiting);
    },
    staleTime: 30 * 1000,
  });
}

export function useRxApprovalSummary() {
  return useQuery({
    // 'mapped' keeps raw pre-mapping responses cached by older builds from being read
    queryKey: ['rx-approvals', 'summary', 'mapped'],
    queryFn: async (): Promise<ApprovalSummary> => toApprovalSummary(await api.get<unknown>('/api/admin/rx-approvals/summary')),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useRxApproval(id: string) {
  return useQuery({
    queryKey: ['rx-approvals', id],
    queryFn: () => api.get<RxApproval>(`/api/admin/rx-approvals/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/** One request as the optician reviews it: snapshot, flags, review session, signature. */
export function useApprovalDetail(id: string | null) {
  return useQuery({
    queryKey: ['rx-approvals', 'detail', id],
    queryFn: async (): Promise<ApprovalView> => toApprovalView(await api.get<FoundryApprovalDetail>(`/api/admin/rx-approvals/${id}`)),
    enabled: !!id,
    staleTime: 0,
  });
}

/** Marks one checklist section reviewed (POST …/checklist { section, viewedAt }). */
export function useMarkReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, section, viewedAt }: { id: string; section: ChecklistSection; viewedAt: string }) =>
      api.post<{ section: string; markedAt: string }>(`/api/admin/rx-approvals/${id}/checklist`, { section, viewedAt }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['rx-approvals', 'detail', v.id] }),
  });
}

export function useSubmitApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitApprovalPayload) =>
      api.post<RxApproval>('/api/admin/rx-approvals', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
    },
  });
}

export function useClaimApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/claim`, {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      // Optimistically update the specific approval
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

export function useReleaseApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/release`, {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

export function useReturnApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnPayload }) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/return`, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

export function useRejectApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectPayload }) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/reject`, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

export function useSignOffApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SignOffPayload }) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/sign-off`, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

export function useSubmitCorrections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CorrectionsPayload }) =>
      api.post<RxApproval>(`/api/admin/rx-approvals/${id}/corrections`, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
      qc.setQueryData(['rx-approvals', data.id], data);
    },
  });
}

/**
 * Reports review time while the request is open and the app is in front (Foundry adds
 * deltaSeconds, capped at 15, to the session's dwell; sign-off needs a minimum).
 */
export function useApprovalHeartbeat() {
  return useMutation({
    mutationFn: ({ id, deltaSeconds = 10 }: { id: string; deltaSeconds?: number }) =>
      api.post<{ dwellSeconds: number }>(`/api/admin/rx-approvals/${id}/heartbeat`, { deltaSeconds }),
  });
}

export function useApprovalChecklist(id: string) {
  return useQuery({
    queryKey: ['rx-approvals', id, 'checklist'],
    queryFn: () => api.get<ApprovalChecklist>(`/api/admin/rx-approvals/${id}/checklist`),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useReadinessCheck(orderId: string) {
  return useQuery({
    queryKey: ['rx-approvals', 'readiness', { orderId }],
    queryFn: () =>
      api.get<ReadinessCheck>('/api/admin/rx-approvals/readiness', {
        params: { orderId },
      }),
    enabled: !!orderId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
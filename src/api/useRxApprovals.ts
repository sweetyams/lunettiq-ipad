import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
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

export function useRxApprovalSummary() {
  return useQuery({
    queryKey: ['rx-approvals', 'summary'],
    queryFn: () => api.get<ApprovalSummary>('/api/admin/rx-approvals/summary'),
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
    mutationFn: ({ id, payload }: { id: string; payload?: SignOffPayload }) =>
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

export function useApprovalHeartbeat() {
  // Fire-and-forget mutation, no invalidation needed
  return useMutation({
    mutationFn: (id: string) =>
      api.post<void>(`/api/admin/rx-approvals/${id}/heartbeat`, {}),
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
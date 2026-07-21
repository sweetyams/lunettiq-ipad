import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Prescription, CreatePrescriptionPayload, UpdatePrescriptionPayload } from './prescriptions.types';

export function usePrescriptions(params?: { clientId?: string }) {
  return useQuery({
    queryKey: ['prescriptions', params],
    queryFn: () => api.get<Prescription[]>('/api/admin/prescriptions', { params }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: ['prescriptions', id],
    queryFn: () => api.get<Prescription>(`/api/admin/prescriptions/${id}`),
    enabled: !!id,
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) =>
      api.post<Prescription>('/api/admin/prescriptions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });
}

export function useUpdatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePrescriptionPayload & { id: string }) =>
      api.patch<Prescription>(`/api/admin/prescriptions/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['prescriptions', id] });
    },
  });
}
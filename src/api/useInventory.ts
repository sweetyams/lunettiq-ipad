import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Protection, CreateProtectionPayload, BarcodeResolveResult } from './inventory.types';

export function useProtections() {
  return useQuery({
    queryKey: ['inventory', 'protections'],
    queryFn: () => api.get<Protection[]>('/api/inventory/protections'),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateProtection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProtectionPayload) =>
      api.post<Protection>('/api/inventory/protections', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'protections'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useExtendProtection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, expiresAt }: { id: string; expiresAt: string }) =>
      api.patch<Protection>(`/api/inventory/protections/${id}`, { expiresAt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'protections'] });
    },
  });
}

export function useReleaseProtection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<void>(`/api/inventory/protections/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'protections'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useResolveBarcode() {
  return useMutation({
    mutationFn: (barcode: string) =>
      api.post<BarcodeResolveResult>('/api/inventory/scan/resolve', { barcode }),
  });
}
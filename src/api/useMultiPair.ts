import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  MultiPairRecommendation,
  MultiPairQuestionnaire,
  InsuranceProfile,
  MultiPairSettings,
  SaveQuestionnairePayload,
  AcceptRecommendationPayload,
  SaveInsurancePayload,
  UpdateInsurancePayload,
} from './multi-pair.types';

export function useMultiPairRecommendations(customerId: string) {
  return useQuery({
    queryKey: ['multi-pair', 'recommendations', customerId],
    queryFn: () => api.get<MultiPairRecommendation[]>('/api/admin/multi-pair/recommend', { 
      params: { customerId } 
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!customerId,
  });
}

export function useAcceptRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcceptRecommendationPayload) =>
      api.post<MultiPairRecommendation>('/api/admin/multi-pair/accept', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-pair'] });
    },
  });
}

export function useMultiPairQuestionnaire(customerId: string) {
  return useQuery({
    queryKey: ['multi-pair', 'questionnaires', customerId],
    queryFn: () => api.get<MultiPairQuestionnaire[]>('/api/admin/multi-pair/questionnaires', {
      params: { customerId }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!customerId,
  });
}

export function useSaveQuestionnaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveQuestionnairePayload) =>
      api.post<MultiPairQuestionnaire>('/api/admin/multi-pair/questionnaires', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-pair'] });
    },
  });
}

export function useInsuranceProfile(customerId: string) {
  return useQuery({
    queryKey: ['multi-pair', 'insurance', customerId],
    queryFn: () => api.get<InsuranceProfile>('/api/admin/multi-pair/insurance', {
      params: { customerId }
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!customerId,
  });
}

export function useSaveInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveInsurancePayload) =>
      api.post<InsuranceProfile>('/api/admin/multi-pair/insurance', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-pair'] });
      qc.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useUpdateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateInsurancePayload & { id: string }) =>
      api.put<InsuranceProfile>(`/api/admin/multi-pair/insurance/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multi-pair'] });
      qc.invalidateQueries({ queryKey: ['insurance'] });
    },
  });
}

export function useMultiPairSettings() {
  return useQuery({
    queryKey: ['multi-pair', 'settings'],
    queryFn: () => api.get<MultiPairSettings>('/api/admin/multi-pair/settings'),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
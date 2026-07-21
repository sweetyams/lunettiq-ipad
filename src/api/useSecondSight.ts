import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { SecondSightIntake, SecondSightStatus } from '../features/second-sight/second-sight.types';

interface CreateSecondSightRequest {
  clientId: string;
  frameDescription: string;
  brand?: string;
  model?: string;
  condition?: string;
  photoUrls: string[];
  notes?: string;
}

interface UpdateSecondSightRequest {
  grade?: string;
  creditAmount?: number;
  notes?: string;
  status?: SecondSightStatus;
}

interface SecondSightListParams {
  status?: SecondSightStatus;
  clientId?: string;
  limit?: number;
  offset?: number;
}

export function useSecondSightList(params?: SecondSightListParams) {
  return useQuery({
    queryKey: ['second-sight', 'list', params],
    queryFn: () => {
      const queryParams = params ? Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, v?.toString() || ''])
      ) : undefined;
      return api.get<SecondSightIntake[]>('/api/second-sight', { params: queryParams });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSecondSight(id: string) {
  return useQuery({
    queryKey: ['second-sight', id],
    queryFn: () => api.get<SecondSightIntake>(`/api/second-sight/${id}`),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateSecondSight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSecondSightRequest) =>
      api.post<SecondSightIntake>('/api/second-sight', data),
    onSuccess: (newIntake) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['second-sight', 'list'] });
      
      // Set the new intake in cache
      queryClient.setQueryData(['second-sight', newIntake.id], newIntake);
      
      // Log interaction for client timeline
      if (newIntake.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: ['clients', newIntake.clientId, 'interactions'] 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create Second Sight intake:', error);
    },
  });
}

export function useUpdateSecondSight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSecondSightRequest }) =>
      api.patch<SecondSightIntake>(`/api/second-sight/${id}`, data),
    onSuccess: (updatedIntake, { id }) => {
      // Update cached intake
      queryClient.setQueryData(['second-sight', id], updatedIntake);
      
      // Invalidate list queries to refresh status/grades
      queryClient.invalidateQueries({ queryKey: ['second-sight', 'list'] });
      
      // Update client timeline if status changed to credit_issued
      if (updatedIntake.status === 'credit_issued' && updatedIntake.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: ['clients', updatedIntake.clientId, 'interactions'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['loyalty', 'credits', updatedIntake.clientId] 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update Second Sight intake:', error);
    },
  });
}

export function useDeleteSecondSight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/second-sight/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['second-sight', id] });
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: ['second-sight', 'list'] });
    },
    onError: (error) => {
      console.error('Failed to delete Second Sight intake:', error);
    },
  });
}

// Hook for manager-only functions (approve grade, override credit)
export function useSecondSightApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, grade, creditAmount }: { id: string; grade: string; creditAmount?: number }) =>
      api.patch<SecondSightIntake>(`/api/second-sight/${id}/approve`, {
        grade,
        creditAmount,
        status: 'graded',
      }),
    onSuccess: (updatedIntake, { id }) => {
      queryClient.setQueryData(['second-sight', id], updatedIntake);
      queryClient.invalidateQueries({ queryKey: ['second-sight', 'list'] });
    },
  });
}

// Hook for issuing credit (final step)
export function useIssueSecondSightCredit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, creditAmount }: { id: string; creditAmount: number }) =>
      api.patch<SecondSightIntake>(`/api/second-sight/${id}/issue-credit`, {
        creditAmount,
        status: 'credit_issued',
      }),
    onSuccess: (updatedIntake, { id }) => {
      queryClient.setQueryData(['second-sight', id], updatedIntake);
      queryClient.invalidateQueries({ queryKey: ['second-sight', 'list'] });
      
      // Refresh client loyalty credits
      if (updatedIntake.clientId) {
        queryClient.invalidateQueries({ 
          queryKey: ['loyalty', 'credits', updatedIntake.clientId] 
        });
      }
    },
  });
}
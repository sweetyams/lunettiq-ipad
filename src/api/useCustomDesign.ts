import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { CustomDesignIntake } from '../features/custom-design/custom-design.types';

export function useCreateCustomDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (intake: Omit<CustomDesignIntake, 'id'>) => {
      return api.post<CustomDesignIntake>('/api/custom-designs', intake);
    },
    onSuccess: (data) => {
      // Invalidate the custom design list
      queryClient.invalidateQueries({ queryKey: ['custom-designs'] });
      
      // Add to the cache
      queryClient.setQueryData(['custom-designs', data.id], data);
    },
  });
}

export function useUpdateCustomDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomDesignIntake> }) => {
      return api.patch<CustomDesignIntake>(`/api/custom-designs/${id}`, data);
    },
    onSuccess: (data, { id }) => {
      // Update the cache
      queryClient.setQueryData(['custom-designs', id], data);
      
      // Invalidate the list to ensure it's fresh
      queryClient.invalidateQueries({ queryKey: ['custom-designs'] });
    },
  });
}

export function useCustomDesignList(params?: { 
  status?: string; 
  limit?: number; 
  clientId?: string; 
}) {
  return useQuery({
    queryKey: ['custom-designs', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.clientId) searchParams.set('clientId', params.clientId);
      
      return api.get<CustomDesignIntake[]>(`/api/custom-designs?${searchParams}`);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - custom designs don't change often
  });
}

export function useCustomDesign(id: string) {
  return useQuery({
    queryKey: ['custom-designs', id],
    queryFn: () => api.get<CustomDesignIntake>(`/api/custom-designs/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDeleteCustomDesign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/custom-designs/${id}`);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['custom-designs', id] });
      
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ['custom-designs'] });
    },
  });
}
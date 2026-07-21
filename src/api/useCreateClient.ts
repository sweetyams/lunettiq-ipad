import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Client, ClientProfile } from './clients.types';

interface CreateClientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  preferredLanguage?: 'en' | 'fr';
  notes?: string;
}

interface DuplicateCheckParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface DuplicateClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
}

interface DuplicateCheckResponse {
  duplicates: DuplicateClient[];
  total: number;
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientData) => 
      api.post<ClientProfile>('/api/clients', data),
    onSuccess: (newClient) => {
      // Invalidate clients list
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Add to cache
      queryClient.setQueryData(['clients', newClient.id], newClient);
    },
  });
}

export function useDuplicateCheck() {
  return useQuery({
    queryKey: ['clients', 'duplicates'],
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as [string, string, DuplicateCheckParams];
      const searchParams: Record<string, string> = {};
      
      if (params.firstName) searchParams.firstName = params.firstName;
      if (params.lastName) searchParams.lastName = params.lastName;
      if (params.email) searchParams.email = params.email;
      if (params.phone) searchParams.phone = params.phone;

      return api.get<DuplicateCheckResponse>('/api/clients/duplicates', { params: searchParams });
    },
    enabled: false, // Manual trigger only
    staleTime: 0, // Always fresh for duplicate checking
  });
}

export function useTriggerDuplicateCheck() {
  const queryClient = useQueryClient();

  return (params: DuplicateCheckParams) => {
    return queryClient.fetchQuery({
      queryKey: ['clients', 'duplicates', params],
      queryFn: () => {
        const searchParams: Record<string, string> = {};
        
        if (params.firstName) searchParams.firstName = params.firstName;
        if (params.lastName) searchParams.lastName = params.lastName;  
        if (params.email) searchParams.email = params.email;
        if (params.phone) searchParams.phone = params.phone;

        return api.get<DuplicateCheckResponse>('/api/clients/duplicates', { params: searchParams });
      },
      staleTime: 0,
    });
  };
}
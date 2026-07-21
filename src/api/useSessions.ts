import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  CreateSessionParams,
  EndSessionParams,
  SessionResponse,
  CreateInteractionParams,
  InteractionResponse,
  CreateProductInteractionParams,
  ProductInteractionResponse,
} from './sessions.types';

/**
 * Create a new try-on session for a client
 * POST /api/clients/{clientId}/tryon-sessions
 */
export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateSessionParams): Promise<SessionResponse> => {
      return api.post(`/api/clients/${params.clientId}/tryon-sessions`, {
        staffId: params.staffId,
        locationId: params.locationId,
      });
    },
    onSuccess: (session, params) => {
      // Invalidate client sessions cache
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'sessions'] 
      });
      
      // Add to active sessions cache
      queryClient.setQueryData(['sessions', session.id], session);
    },
  });
}

/**
 * End a try-on session with outcome and notes
 * POST /api/clients/{clientId}/tryon-sessions/{sessionId}/end
 */
export function useEndSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: EndSessionParams): Promise<SessionResponse> => {
      const { sessionId, clientId, ...endData } = params;
      return api.post(`/api/clients/${clientId}/tryon-sessions/${sessionId}/end`, endData);
    },
    onSuccess: (session, params) => {
      // Update session cache
      queryClient.setQueryData(['sessions', params.sessionId], session);
      
      // Invalidate client sessions and interactions
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'sessions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'interactions'] 
      });
      
      // Invalidate today's appointments if session was from appointment
      queryClient.invalidateQueries({ 
        queryKey: ['appointments', 'today'] 
      });
    },
  });
}

/**
 * Create a timeline interaction for a client
 * POST /api/clients/{clientId}/interactions
 */
export function useCreateInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateInteractionParams): Promise<InteractionResponse> => {
      const { clientId, ...interactionData } = params;
      return api.post(`/api/clients/${clientId}/interactions`, interactionData);
    },
    onSuccess: (interaction, params) => {
      // Invalidate client interactions timeline
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'interactions'] 
      });
    },
  });
}

/**
 * Create a product interaction (tried_on, liked, etc.)
 * POST /api/clients/{clientId}/product-interactions
 */
export function useCreateProductInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateProductInteractionParams): Promise<ProductInteractionResponse> => {
      const { clientId, ...interactionData } = params;
      return api.post(`/api/clients/${clientId}/product-interactions`, interactionData);
    },
    onSuccess: (interaction, params) => {
      // Invalidate client product interactions and suggestions
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'product-interactions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'suggestions'] 
      });
    },
  });
}

/**
 * Batch create multiple product interactions (for session end)
 */
export function useCreateBatchProductInteractions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (interactions: CreateProductInteractionParams[]): Promise<ProductInteractionResponse[]> => {
      // Create all interactions in parallel
      const promises = interactions.map(params => {
        const { clientId, ...interactionData } = params;
        return api.post<ProductInteractionResponse>(`/api/clients/${clientId}/product-interactions`, interactionData);
      });
      
      return Promise.all(promises);
    },
    onSuccess: (interactions, params) => {
      if (params.length > 0) {
        const clientId = params[0]?.clientId;
        
        if (clientId) {
          // Invalidate client caches
          queryClient.invalidateQueries({ 
            queryKey: ['clients', clientId, 'product-interactions'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['clients', clientId, 'suggestions'] 
          });
        }
      }
    },
  });
}
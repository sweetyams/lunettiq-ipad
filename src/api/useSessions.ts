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
 * End a try-on session with outcome and notes.
 * POST /api/clients/{clientId}/tryon-sessions/{sessionId}/end
 *
 * The handler sets status='completed', records the outcome, and fires
 * a Klaviyo event for the summary email asynchronously.
 */
export function useEndSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: EndSessionParams): Promise<SessionResponse> => {
      const { sessionId, clientId, outcomeTag, sendSummary, summaryLanguage, internalNotes, tags, orderRef } = params;
      
      // Map iPad outcome tags to Foundry's outcome enum
      const outcomeMap: Record<string, string> = {
        purchased: 'purchased',
        booked_next_visit: 'needs_followup',
        shortlist_emailed: 'saved_for_later',
        left_empty_handed: 'no_match',
      };

      return api.post(`/api/clients/${clientId}/tryon-sessions/${sessionId}/end`, {
        outcome: outcomeMap[outcomeTag] ?? 'no_match',
        notes: internalNotes || undefined,
        // Extra metadata for iPad-specific fields (server ignores unknown keys gracefully)
        sendSummary,
        summaryLanguage,
        tags,
        orderRef: orderRef ?? undefined,
      });
    },
    onSuccess: (_, params) => {
      // Invalidate client interactions timeline
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'interactions'] 
      });
      
      // Invalidate client sessions list
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'sessions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['clients', params.clientId, 'tryon-sessions'] 
      });
      
      // Invalidate today's appointments
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

// NOTE: useCreateBatchProductInteractions lives in ./useProductInteractions.ts
// It is the canonical batch hook with `surface: 'tablet'` and metadata support.
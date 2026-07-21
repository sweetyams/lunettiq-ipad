import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// Product interaction types
export interface CreateProductInteractionParams {
  clientId: string;
  productId: string;
  variantId?: string;
  type: 'tried_on' | 'liked' | 'loved' | 'rejected' | 'shortlisted' | 'purchased' | 'viewed';
  sessionId?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ProductInteractionResponse {
  id: string;
  clientId: string;
  productId: string;
  variantId: string | null;
  type: string;
  sessionId: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Create a product interaction (tried_on, liked, etc.)
 */
export function useCreateProductInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: CreateProductInteractionParams): Promise<ProductInteractionResponse> => {
      const { clientId, ...interactionData } = params;
      return api.post(`/api/clients/${clientId}/product-interactions`, {
        ...interactionData,
        surface: 'tablet',
      });
    },
    onSuccess: (_, params) => {
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
      const promises = interactions.map(params => {
        const { clientId, ...interactionData } = params;
        return api.post<ProductInteractionResponse>(
          `/api/clients/${clientId}/product-interactions`, 
          { ...interactionData, surface: 'tablet' }
        );
      });
      
      return Promise.all(promises);
    },
    onSuccess: (_, params) => {
      if (params.length > 0) {
        const clientId = params[0]?.clientId;
        if (clientId) {
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

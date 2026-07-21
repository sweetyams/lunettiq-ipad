import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import type { AiStylistRequest, AiStylistResponse } from './aiStylist.types';

interface UseAiStylistParams {
  clientId: string;
  context?: string;
}

/**
 * AI Stylist mutation — POST /api/clients/{id}/ai-styler.
 *
 * LLM-powered advisory that returns a thought paragraph and
 * tappable chip buttons for the SA during consultation.
 *
 * Usage:
 *   const aiStylist = useAiStylist();
 *   aiStylist.mutate({ clientId: 'abc', context: 'looking for something bold' });
 *   // aiStylist.data → { thought, chips, model, tokens }
 */
export function useAiStylist() {
  return useMutation({
    mutationFn: async ({ clientId, context }: UseAiStylistParams): Promise<AiStylistResponse> => {
      const body: AiStylistRequest = {};
      if (context) body.context = context;

      const result = await api.post<AiStylistResponse>(
        `/api/clients/${clientId}/ai-styler`,
        body
      );
      return result;
    },
  });
}

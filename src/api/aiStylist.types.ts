/**
 * AI Stylist types — matches Foundry POST /api/clients/{id}/ai-styler response.
 * LLM-powered styling advisor returning a thought + actionable chips.
 */

export interface AiStylistRequest {
  context?: string;
}

export interface AiStylistResponse {
  thought: string;
  chips: string[];
  model: string;
  tokens: {
    input: number;
    output: number;
  };
}

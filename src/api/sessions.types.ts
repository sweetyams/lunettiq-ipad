// Session API Types for Foundry integration

export interface CreateSessionParams {
  clientId: string;
  staffId?: string;
  locationId?: string;
}

export interface EndSessionParams {
  sessionId: string;
  clientId: string;
  outcomeTag: 'purchased' | 'booked_next_visit' | 'shortlist_emailed' | 'left_empty_handed';
  sendSummary: boolean;
  summaryLanguage: 'en' | 'fr';
  internalNotes: string;
  tags: string[];
  orderRef?: string;
}

export interface SessionResponse {
  id: string;
  clientId: string;
  staffId: string;
  locationId: string;
  startedAt: string;
  endedAt: string | null;
  framesTried: FrameTried[];
  outcomeTag: string | null;
  internalNotes: string | null;
  summaryEmailed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FrameTried {
  id: string;
  sessionId: string;
  productId: string;
  variantId?: string;
  photoUrls: string[];
  verdict: 'loved' | 'liked' | 'unsure' | 'rejected' | null;
  notes: string;
  clientVisible: boolean;
  shortlisted: boolean;
  capturedAt: string;
}

export interface CreateInteractionParams {
  clientId: string;
  type: 'fitting' | 'note' | 'call' | 'email' | 'visit';
  summary: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export interface InteractionResponse {
  id: string;
  clientId: string;
  staffId: string;
  type: string;
  summary: string;
  details: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateProductInteractionParams {
  clientId: string;
  productId: string;
  variantId?: string;
  type: 'tried_on' | 'liked' | 'loved' | 'rejected' | 'shortlisted' | 'purchased';
  sessionId?: string;
  notes?: string;
}

export interface ProductInteractionResponse {
  id: string;
  clientId: string;
  productId: string;
  variantId: string | null;
  type: string;
  sessionId: string | null;
  notes: string | null;
  createdAt: string;
}

export type OutcomeTag = 'purchased' | 'booked_next_visit' | 'shortlist_emailed' | 'left_empty_handed';
export type Language = 'en' | 'fr';
export type QuickTag = 'follow_up' | 'price_sensitive' | 'bring_spouse' | 'size_up' | 'rx_needed' | 'budget_concern';
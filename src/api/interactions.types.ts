export interface Interaction {
  id: string;
  shopifyCustomerId: string;
  type: string; // 'note' | 'call' | 'visit' | 'email' | 'session' | 'privacy_mode_change'
  direction: string; // 'internal' | 'inbound' | 'outbound'
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  staffId: string | null;
  locationId: string | null;
  surface: string; // 'web' | 'tablet'
  occurredAt: string;
  createdAt: string;
}

export interface CreateInteractionParams {
  clientId: string;
  type: string;
  notes?: string;
  direction?: string;
  subject?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  surface?: string;
}

export interface InteractionListResponse {
  interactions: Interaction[];
  total: number;
}
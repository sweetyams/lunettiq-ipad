/**
 * Client types — matches Foundry API response shape.
 * Source: shopifyCustomers + crmClientEnrichments tables.
 */

export interface ClientEnrichment {
  id: string;
  shopifyCustomerId: string;
  faceShape: string | null;
  frameWidthMm: number | null;
  bridgeWidthMm: number | null;
  internalNotes: string | null;
  homeLocationId: string | null;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  shopifyId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  orderCount: number | null;
  totalSpent: string | null;
  note: string | null;
  state: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile extends Client {
  enrichment: ClientEnrichment | null;
}

export interface ClientListResponse {
  clients: Client[];
  total: number;
}

export interface ClientSearchParams {
  q?: string;
  limit?: number;
  offset?: number;
}

/**
 * Client types — matches actual Foundry API response shape.
 * Source: Foundry's /api/clients endpoint.
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
  id: string;               // UUID (primary key)
  projectId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpent: number | null;
  orderCount: number | null;
  tags: string[];
  status: string;           // 'active', 'merged', etc.
  updatedAt: string;        // ISO date
  createdAt: string;        // ISO date
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
  sort?: string;
  limit?: number;
  offset?: number;
}

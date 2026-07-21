/**
 * Client API hooks — TanStack Query hooks for all Foundry /api/clients/* endpoints.
 *
 * Covers: search, profile, update, enrichment, preferences, interactions,
 * orders, prescriptions, wishlist, segments, product-interactions,
 * tryon-sessions, suggestions, and links.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Client,
  ClientProfile,
  ClientEnrichment,
  ClientListResponse,
  ClientSearchParams,
  ClientUpdateParams,
  EnrichmentUpdateParams,
  ClientPreferences,
  StatedPreferences,
  Interaction,
  CreateInteractionParams,
  UpdateInteractionParams,
  ClientOrder,
  Prescription,
  WishlistItem,
  WishlistGroup,
  ClientSegment,
  ProductInteraction,
  TryonSession,
  ClientSuggestion,
  ClientLink,
  FieldConfig,
} from './clients.types';

// ─── Client List & Search ────────────────────────────────────

export function useClients(params?: ClientSearchParams) {
  const searchParams: Record<string, string> = {};
  if (params?.q) searchParams.q = params.q;
  if (params?.tag) searchParams.tag = params.tag;
  if (params?.sort) searchParams.sort = params.sort;
  if (params?.limit) searchParams.limit = String(params.limit);
  if (params?.offset) searchParams.offset = String(params.offset);

  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.get<ClientListResponse>('/api/clients', { params: searchParams }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentClients() {
  return useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: () =>
      api.get<ClientListResponse>('/api/clients', {
        params: { sort: 'updatedAt', limit: '5' },
      }),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Client Profile ──────────────────────────────────────────

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get<ClientProfile>(`/api/clients/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientUpdateParams }) =>
      api.patch<ClientProfile>(`/api/clients/${id}`, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// ─── Enrichment ──────────────────────────────────────────────

export function useClientEnrichment(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'enrichment'],
    queryFn: () => api.get<ClientEnrichment>(`/api/clients/${clientId}/enrichment`),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateEnrichment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: EnrichmentUpdateParams }) =>
      api.put<ClientEnrichment>(`/api/clients/${clientId}/enrichment`, data),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'enrichment'] });
      qc.invalidateQueries({ queryKey: ['clients', clientId] });
    },
  });
}

// ─── Preferences ─────────────────────────────────────────────

export function useClientPreferences(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'preferences'],
    queryFn: () => api.get<ClientPreferences>(`/api/clients/${clientId}/preferences`),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: StatedPreferences }) =>
      api.put<ClientPreferences>(`/api/clients/${clientId}/preferences`, data),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'preferences'] });
    },
  });
}

// ─── Interactions / Timeline ─────────────────────────────────

export function useClientInteractions(clientId: string, limit = 50) {
  return useQuery({
    queryKey: ['clients', clientId, 'interactions', { limit }],
    queryFn: () =>
      api.get<Interaction[]>(`/api/clients/${clientId}/interactions`, {
        params: { limit: String(limit) },
      }),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateInteractionParams }) =>
      api.post<Interaction>(`/api/clients/${clientId}/interactions`, {
        ...data,
        surface: 'tablet',
      }),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'interactions'] });
    },
  });
}

export function useUpdateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      interactionId,
      data,
    }: {
      clientId: string;
      interactionId: string;
      data: UpdateInteractionParams;
    }) => api.patch<Interaction>(`/api/clients/${clientId}/interactions/${interactionId}`, data),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'interactions'] });
    },
  });
}

// ─── Orders ──────────────────────────────────────────────────

export function useClientOrders(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'orders'],
    queryFn: () => api.get<ClientOrder[]>(`/api/clients/${clientId}/orders`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Prescriptions ───────────────────────────────────────────

export function useClientPrescriptions(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'prescriptions'],
    queryFn: () => api.get<Prescription[]>(`/api/clients/${clientId}/prescriptions`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Wishlist ────────────────────────────────────────────────

export function useClientWishlist(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'wishlist'],
    queryFn: () => api.get<WishlistItem[]>(`/api/clients/${clientId}/wishlist`),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

export function useClientWishlistGroups(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'wishlist', 'groups'],
    queryFn: () => api.get<WishlistGroup[]>(`/api/clients/${clientId}/wishlist/groups`),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });
}

export function useCreateWishlistGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, name, itemIds }: { clientId: string; name: string; itemIds: string[] }) =>
      api.post<WishlistGroup>(`/api/clients/${clientId}/wishlist/groups`, { name, itemIds }),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'wishlist'] });
    },
  });
}

export function useDeleteWishlistGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, groupId }: { clientId: string; groupId: string }) =>
      api.delete<void>(`/api/clients/${clientId}/wishlist/groups/${groupId}`),
    onSuccess: (_, { clientId }) => {
      qc.invalidateQueries({ queryKey: ['clients', clientId, 'wishlist'] });
    },
  });
}

// ─── Segments ────────────────────────────────────────────────

export function useClientSegments(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'segments'],
    queryFn: () => api.get<ClientSegment[]>(`/api/clients/${clientId}/segments`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Product Interactions ────────────────────────────────────

export function useClientProductInteractions(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'product-interactions'],
    queryFn: () => api.get<ProductInteraction[]>(`/api/clients/${clientId}/product-interactions`),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Try-on Sessions ─────────────────────────────────────────

export function useClientTryonSessions(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'tryon-sessions'],
    queryFn: () => api.get<TryonSession[]>(`/api/clients/${clientId}/tryon-sessions`),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Suggestions ─────────────────────────────────────────────

export function useClientSuggestions(clientId: string, limit = 12) {
  return useQuery({
    queryKey: ['clients', clientId, 'suggestions', { limit }],
    queryFn: () =>
      api.get<ClientSuggestion[]>(`/api/clients/${clientId}/suggestions`, {
        params: { limit: String(limit) },
      }),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Client Links (Relationships) ───────────────────────────

export function useClientLinks(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'links'],
    queryFn: () => api.get<ClientLink[]>(`/api/clients/${clientId}/links`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Field Config ────────────────────────────────────────────

export function useClientFieldConfig() {
  return useQuery({
    queryKey: ['clients', 'field-config'],
    queryFn: () => api.get<FieldConfig[]>('/api/clients/field-config'),
    staleTime: 30 * 60 * 1000, // 30 min — rarely changes
  });
}

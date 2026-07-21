export { api, queryClient, APIError } from './client';
export { tokenCache } from './tokenCache';
export { useClients, useClient, useUpdateClient } from './useClients';
export type { Client, ClientProfile, ClientEnrichment, ClientListResponse, ClientSearchParams } from './clients.types';
export { useProducts, useProduct } from './useProducts';
export { useSuggestions } from './useSuggestions';
export { useCreateProductInteraction, useCreateBatchProductInteractions } from './useProductInteractions';
export type {
  Product, ProductDetail, ProductVariant, ProductImage, ProductListParams,
  ProductListResponse, ProductDetailResponse, ProductViewHints,
  ScoredProduct,
  ProductInteractionType, CreateProductInteractionParams, ProductInteraction,
} from './products.types';
export { useFilters } from './useFilters';
export type { FilterGroup, FilterValue, ProductFilterMap, FiltersResponse } from './filters.types';
export { useProductFamily } from './useProductFamily';
export type { ProductSibling, ProductFamilyResponse } from './families.types';
export { useAiStylist } from './useAiStylist';
export type { AiStylistRequest, AiStylistResponse } from './aiStylist.types';
export { useProductEnhancement } from './useProductEnhancement';
export type { ProductEnhancement, BodySection } from './enhancements.types';
export { useInteractions, useCreateInteraction } from './useInteractions';
export type { Interaction, CreateInteractionParams, InteractionListResponse } from './interactions.types';
export { useAppointments, useUpdateAppointment } from './useAppointments';
export type { Appointment, AppointmentListParams } from './appointments.types';

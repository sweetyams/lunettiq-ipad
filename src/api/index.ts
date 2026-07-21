export { api, queryClient, APIError } from './client';
export { tokenCache } from './tokenCache';

// ─── Clients ─────────────────────────────────────────────────
export {
  useClients,
  useRecentClients,
  useClient,
  useUpdateClient,
  useClientEnrichment,
  useUpdateEnrichment,
  useClientPreferences,
  useUpdatePreferences,
  useClientInteractions,
  useCreateInteraction,
  useUpdateInteraction,
  useClientOrders,
  useClientPrescriptions,
  useClientWishlist,
  useClientWishlistGroups,
  useCreateWishlistGroup,
  useDeleteWishlistGroup,
  useClientSegments,
  useClientProductInteractions,
  useClientTryonSessions,
  useClientSuggestions,
  useClientLinks,
  useClientFieldConfig,
} from './useClients';
export type {
  Client,
  ClientProfile,
  ClientEnrichment,
  ClientAddress,
  ClientListResponse,
  ClientSearchParams,
  ClientUpdateParams,
  EnrichmentUpdateParams,
  StatedPreferences,
  DerivedPreferences,
  ClientPreferences,
  Interaction,
  InteractionType,
  InteractionDirection,
  CreateInteractionParams,
  UpdateInteractionParams,
  ClientOrder,
  OrderLineItem,
  PrescriptionEye,
  WishlistItem,
  WishlistProduct,
  WishlistGroup,
  ClientSegment,
  ProductInteractionSource,
  TryonSession,
  ClientSuggestion,
  ClientLink,
  RelationshipType,
  FieldConfig,
} from './clients.types';
// Note: ProductInteraction and ProductInteractionType are exported from products.types.ts

// ─── Products ────────────────────────────────────────────────
export { useProducts, useProduct } from './useProducts';
export { useSuggestions } from './useSuggestions';
export { useCreateProductInteraction, useCreateBatchProductInteractions } from './useProductInteractions';
export type {
  Product, ProductDetail, ProductVariant, ProductImage, ProductListParams,
  ProductListResponse, ProductDetailResponse, ProductViewHints,
  ScoredProduct,
} from './products.types';
export { useFilters } from './useFilters';
export type { FilterGroup, FilterValue, ProductFilterMap, FiltersResponse } from './filters.types';
export { useProductFamily } from './useProductFamily';
export type { ProductSibling, ProductFamilyResponse } from './families.types';
export { useAiStylist } from './useAiStylist';
export type { AiStylistRequest, AiStylistResponse } from './aiStylist.types';
export { useProductEnhancement } from './useProductEnhancement';
export type { ProductEnhancement, BodySection } from './enhancements.types';

// ─── Interactions (legacy — prefer useClientInteractions) ────
export { useInteractions, useCreateInteraction as useCreateInteractionLegacy } from './useInteractions';
export type { InteractionListResponse } from './interactions.types';

// ─── Appointments ────────────────────────────────────────────
export { useAppointments, useUpdateAppointment } from './useAppointments';
export type { Appointment, AppointmentListParams } from './appointments.types';

// ─── Rx Pipeline ─────────────────────────────────────────────
export {
  useRxPipelineOrders,
  useRxPipelineOrder,
  useRxPipelineCounts,
  useCreateRxOrder,
  useUpdateRxOrder,
} from './useRxPipeline';
export type {
  RxOrder,
  RxOrderState,
  RxMeasurements,
  RxPipelineCounts,
  CreateRxOrderPayload,
  UpdateRxOrderPayload,
} from './rx-pipeline.types';

// ─── Prescriptions ───────────────────────────────────────────
export {
  usePrescriptions,
  usePrescription,
  useCreatePrescription,
  useUpdatePrescription,
} from './usePrescriptions';
export type {
  Prescription as PrescriptionRecord,
  CreatePrescriptionPayload,
  UpdatePrescriptionPayload,
} from './prescriptions.types';

// ─── Multi-Pair Recommendations ─────────────────────────────
export {
  useMultiPairRecommendations,
  useAcceptRecommendation,
  useMultiPairQuestionnaire,
  useSaveQuestionnaire,
  useInsuranceProfile,
  useSaveInsurance,
  useUpdateInsurance,
  useMultiPairSettings,
} from './useMultiPair';
export type {
  MultiPairRecommendation,
  MultiPairProduct,
  MultiPairQuestionnaire,
  QuestionnaireAnswer,
  InsuranceProfile,
  MultiPairSettings,
  SaveQuestionnairePayload,
  AcceptRecommendationPayload,
  SaveInsurancePayload,
  UpdateInsurancePayload,
} from './multi-pair.types';

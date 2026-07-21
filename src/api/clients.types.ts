/**
 * Client types — matches Foundry API response shapes.
 * Source: Foundry's /api/clients/* endpoints.
 *
 * Covers: profile, enrichment, preferences, interactions, orders,
 * prescriptions, wishlist, segments, product-interactions, tryon-sessions,
 * suggestions, and client links.
 */

// ─── Core Client ─────────────────────────────────────────────

export interface Client {
  id: string;
  projectId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpent: number | null;
  orderCount: number | null;
  tags: string[];
  status: 'active' | 'merged' | 'archived';
  acceptsMarketing: boolean | null;
  defaultAddress: ClientAddress | null;
  updatedAt: string;
  createdAt: string;
}

export interface ClientAddress {
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
}

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

export interface ClientProfile extends Client {
  enrichment: ClientEnrichment | null;
}

// ─── Enrichment Update ───────────────────────────────────────

export interface EnrichmentUpdateParams {
  faceShape?: string | null;
  frameWidthMm?: number | null;
  bridgeWidthMm?: number | null;
  internalNotes?: string | null;
  homeLocationId?: string | null;
  customFields?: Record<string, unknown>;
}

// ─── Client Update ───────────────────────────────────────────

export interface ClientUpdateParams {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  tags?: string[];
}

// ─── Preferences ─────────────────────────────────────────────

export interface StatedPreferences {
  shapes: string[];
  materials: string[];
  colours: string[];
  avoid: string[];
  brandsAdmired: string[];
  notes: string;
}

export interface DerivedPreferences {
  id: string;
  shopifyCustomerId: string;
  derivedShapes: Record<string, number>;
  derivedMaterials: Record<string, number>;
  derivedColours: Record<string, number>;
  derivedPriceRange: { min: number; max: number; avg: number } | null;
  sourceOrderCount: number;
  lastComputedAt: string | null;
}

export interface ClientPreferences {
  stated: StatedPreferences;
  derived: DerivedPreferences | null;
}

// ─── Interactions ────────────────────────────────────────────

export type InteractionType =
  | 'note'
  | 'phone_call'
  | 'email'
  | 'sms'
  | 'in_store_visit'
  | 'fitting'
  | 'purchase_assist'
  | 'follow_up'
  | 'complaint'
  | 'product_recommendation'
  | 'preferences_updated'
  | 'return_request'
  | 'appointment'
  | 'custom';

export type InteractionDirection = 'inbound' | 'outbound' | 'internal';

export interface Interaction {
  id: string;
  shopifyCustomerId: string;
  type: InteractionType;
  direction: InteractionDirection;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  staffId: string | null;
  locationId: string | null;
  surface: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface CreateInteractionParams {
  type: InteractionType;
  direction?: InteractionDirection;
  subject?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
  locationId?: string | null;
  occurredAt?: string;
}

export interface UpdateInteractionParams {
  subject?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;
}

// ─── Orders ──────────────────────────────────────────────────

export interface ClientOrder {
  id: string;
  orderNumber: string;
  status: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  totalPrice: number;
  currency: string;
  lineItems: OrderLineItem[];
  createdAt: string;
}

export interface OrderLineItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  quantity: number;
  price: number;
  image: string | null;
}

// ─── Prescriptions ───────────────────────────────────────────

export interface Prescription {
  id: string;
  clientId: string;
  status: 'draft' | 'active' | 'expired' | 'superseded';
  issuedAt: string;
  expiresAt: string;
  isValid: boolean;
  prescriber: string | null;
  rightEye: PrescriptionEye | null;
  leftEye: PrescriptionEye | null;
  addPower: number | null;
  pd: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionEye {
  sphere: number | null;
  cylinder: number | null;
  axis: number | null;
  prism: number | null;
  prismBase: string | null;
}

// ─── Wishlist ────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  clientId: string;
  productId: string;
  variantId: string | null;
  addedAt: string;
  addedBy: string | null;
  notes: string | null;
  product: WishlistProduct | null;
}

export interface WishlistProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string | null;
  image: { url: string; alt: string | null } | null;
  price: number | null;
}

export interface WishlistGroup {
  id: string;
  clientId: string;
  name: string;
  items: WishlistItem[];
  createdAt: string;
}

// ─── Segments ────────────────────────────────────────────────

export interface ClientSegment {
  id: string;
  name: { en: string; fr: string };
  description: { en: string; fr: string };
  memberCount: number;
  addedAt: string;
}

// ─── Product Interactions ────────────────────────────────────

export type ProductInteractionType =
  | 'viewed'
  | 'tried_on'
  | 'liked'
  | 'disliked'
  | 'saved'
  | 'shared'
  | 'purchased'
  | 'recommended';

export type ProductInteractionSource =
  | 'storefront'
  | 'klaviyo_click'
  | 'in_store'
  | 'tablet'
  | 'admin';

export interface ProductInteraction {
  id: string;
  shopifyCustomerId: string;
  productId: string;
  variantId: string | null;
  type: ProductInteractionType;
  source: ProductInteractionSource;
  sessionId: string | null;
  locationId: string | null;
  staffId: string | null;
  occurredAt: string;
  product?: {
    title: string;
    handle: string;
    image: string | null;
  };
}

// ─── Try-on Sessions ─────────────────────────────────────────

export interface TryonSession {
  id: string;
  clientId: string;
  staffId: string | null;
  locationId: string | null;
  status: 'active' | 'completed' | 'abandoned';
  outcome: 'purchased' | 'booked' | 'shortlisted' | 'left_empty' | null;
  framesTried: number;
  photosCount: number;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
}

// ─── Suggestions ─────────────────────────────────────────────

export interface ClientSuggestion {
  productId: string;
  score: number;
  reasons: string[];
  product: {
    title: string;
    handle: string;
    vendor: string | null;
    image: string | null;
    price: number | null;
  };
}

// ─── Client Links (Relationships) ───────────────────────────

export type RelationshipType =
  | 'spouse'
  | 'parent'
  | 'child'
  | 'sibling'
  | 'partner'
  | 'colleague'
  | 'other';

export interface ClientLink {
  id: string;
  clientAId: string;
  clientBId: string;
  relationshipType: RelationshipType;
  linkedClient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  createdBy: string | null;
  createdAt: string;
}

// ─── List Responses ──────────────────────────────────────────

export interface ClientListResponse {
  clients: Client[];
  total: number;
}

export interface ClientSearchParams {
  q?: string;
  tag?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

// ─── Field Config ────────────────────────────────────────────

export interface FieldConfig {
  key: string;
  label: { en: string; fr: string };
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';
  options?: string[];
  required?: boolean;
  section: string;
}

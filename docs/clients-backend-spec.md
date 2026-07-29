# Clients — Backend API Spec

> iPad app ↔ Foundry API contract for the Clients feature.
> Audience: UX designers, frontend developers, QA.

## Base Configuration

| Environment | Base URL |
|---|---|
| Development | `http://lunettiq.localhost:4000` |
| Production | `https://lunettiq.bentspline.com` |

Every request includes:

```
Authorization: Bearer <clerk_session_token>
X-Found-Surface: tablet
Content-Type: application/json
```

## Response Envelope

All endpoints return the same shape:

```typescript
// Success
{
  data: T,
  error: null,
  meta: { requestId: string, total?: number, limit?: number, offset?: number }
}

// Error
{
  data: null,
  error: { code: string, message: string, details?: unknown },
  meta: { requestId: string }
}
```

## Error Codes

| Code | HTTP | iPad Handling |
|---|---|---|
| `UNAUTHORIZED` | 401 | Wait 1s → fresh token → retry once → redirect to login |
| `FORBIDDEN` | 403 | Toast "Permission denied" — don't retry |
| `VALIDATION` | 400 | Show field-level errors from `error.details` |
| `NOT_FOUND` | 404 | Remove from local cache, show graceful empty state |
| `RATE_LIMITED` | 429 | Back off per `Retry-After` header |
| `INTERNAL` | 500 | Queue for retry via offline sync queue |

---

## Data Model

### Client (Core Profile)

Foundry uses a **projection + enrichment** pattern: Shopify owns contact/purchase data, Foundry CRM layers editorial enrichment on top.

```typescript
interface Client {
  id: string;                          // Shopify customer ID (gid format)
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  locale: 'en' | 'fr';                // Client language preference
  avatarUrl: string | null;            // Profile photo
  tags: string[];                      // Internal tags (e.g. "VIP", "price-sensitive")
  note: string | null;                 // Shopify note field
  createdAt: string;                   // ISO 8601
  updatedAt: string;

  // Computed / aggregated
  orderCount: number;
  totalSpent: number;                  // Lifetime value in cents
  lastOrderDate: string | null;
  averageOrderValue: number;

  // Loyalty
  tier: 'essential' | 'cult' | 'vault' | null;
  creditBalance: number;               // In cents

  // Address
  defaultAddress: {
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    country: string | null;
  } | null;
}
```

### Client Enrichment (CRM Layer)

```typescript
interface ClientEnrichment {
  clientId: string;
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond' | null;
  frameWidth: number | null;           // mm — measured temple-to-temple
  noseWidth: 'narrow' | 'medium' | 'wide' | null;
  noseBridge: 'low' | 'medium' | 'high' | null;
  ipd: number | null;                  // Interpupillary distance in mm
  skinTone: string | null;             // Warm/cool/neutral
  hairColor: string | null;
  notes: string | null;                // Freeform SA notes (staff-only)
  customFields: Record<string, string>;
  updatedAt: string;
  updatedBy: string;                   // Staff user ID
}
```

### Client Preferences

```typescript
interface ClientPreferences {
  clientId: string;

  // Stated preferences (from conversation/questionnaire)
  stated: {
    styles: string[];                  // e.g. ["aviator", "cat-eye", "round"]
    materials: string[];               // e.g. ["acetate", "titanium"]
    colors: string[];                  // e.g. ["tortoise", "black", "gold"]
    brands: string[];                  // e.g. ["Moscot", "Garrett Leight"]
    priceRange: { min: number; max: number } | null;
    lifestyle: string[];               // e.g. ["sports", "driving", "screen-work"]
  };

  // Derived preferences (computed from product interactions)
  derived: {
    topStyles: string[];
    topMaterials: string[];
    topColors: string[];
    topBrands: string[];
    avgPricePoint: number | null;
    confidence: number;                // 0-100, how much data backs this
  };

  updatedAt: string;
}
```

### Interaction (Timeline Entry)

```typescript
interface Interaction {
  id: string;
  clientId: string;
  type: InteractionType;
  direction: 'inbound' | 'outbound' | 'internal';
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;   // Type-specific data
  staffId: string;
  staffName: string;
  surface: 'tablet' | 'web' | 'system';
  createdAt: string;
  updatedAt: string;
}

type InteractionType =
  | 'note'
  | 'call'
  | 'email'
  | 'visit'
  | 'fitting'
  | 'purchase'
  | 'return'
  | 'consultation'
  | 'follow_up'
  | 'complaint'
  | 'referral'
  | 'second_sight'
  | 'custom_design'
  | 'privacy_mode_change';
```

---

## Endpoints

### 1. Client List & Search

```
GET /api/clients?q={search}&tag={tag}&sort={field}&limit={n}&offset={n}
```

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | — | Fuzzy search (name, email, phone). Uses pg_trgm. |
| `tag` | string | — | Filter by tag (repeatable) |
| `sort` | string | `lastName` | Sort field: `lastName`, `createdAt`, `lastOrderDate`, `totalSpent` |
| `limit` | number | 50 | Max results (max 100) |
| `offset` | number | 0 | Pagination offset |

**Permission:** `org:clients:read`

**Response:** `{ data: Client[], meta: { total, limit, offset } }`

**iPad usage:** Powers CLI-01 (client list/search), global search, and session client picker.

---

### 2. Client Profile (Detail)

```
GET /api/clients/{id}
```

**Permission:** `org:clients:read`

**Response:** `{ data: ClientProfile }` — full Client + enrichment + preferences in a single response.

```typescript
interface ClientProfile extends Client {
  enrichment: ClientEnrichment | null;
  preferences: ClientPreferences | null;
  recentInteractions: Interaction[];     // Last 5 entries
  activeHolds: InventoryHold[];          // Current frame holds
  upcomingAppointments: Appointment[];   // Next 3
}
```

**iPad usage:** Powers CLI-02 (client profile screen), session context panel (SES-01).

---

### 3. Create Client

```
POST /api/clients
```

**Permission:** `org:clients:write`

**Request body:**

```typescript
{
  firstName: string;          // Required
  lastName: string;           // Required
  email?: string;
  phone?: string;
  locale?: 'en' | 'fr';      // Default: 'en'
  tags?: string[];
  note?: string;
  address?: {
    address1?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;         // Default: 'CA'
  };
}
```

**Response:** `{ data: Client }` — the newly created client.

**Validation errors:** Returned in `error.details` as field → message map.

**Important:** This endpoint **cannot work offline** — it requires a server-side duplicate check before creation.

**iPad usage:** Powers CLI-03 (new client sheet).

---

### 4. Update Client

```
PATCH /api/clients/{id}
```

**Permission:** `org:clients:write`

**Request body:** Partial Client fields (any subset of the create body).

**Response:** `{ data: Client }` — updated client.

**Conflict resolution:** Newest-wins with audit trail. If the iPad edits offline and another surface edits the same client later, the later edit wins.

**iPad usage:** Inline edit on CLI-02 profile screen.

---

### 5. Duplicate Detection

```
GET /api/clients/duplicates
```

**Permission:** `org:clients:read`

**Response:** List of duplicate candidate pairs with confidence score and match reason.

```typescript
interface DuplicateCandidate {
  clientAId: string;
  clientBId: string;
  confidence: number;        // 0-100
  matchReason: string;       // e.g. "Email match: m.dubois@gmail.com"
  status: 'pending' | 'merged' | 'dismissed';
}
```

**iPad usage:** Powers CLI-04 (duplicate resolution during client creation). Also used during real-time creation flow to warn SA about potential duplicates before saving.

---

### 6. Field Configuration

```
GET /api/clients/field-config
```

**Permission:** `org:clients:read`

**Response:** Configuration for which fields are enabled, required, and their display labels. Allows per-tenant customization of the client form.

**iPad usage:** Controls which fields appear in CLI-03 (new client) and CLI-02 (profile edit).

---

### 7. Interactions (Timeline)

#### List interactions

```
GET /api/clients/{id}/interactions?limit=50&offset=0
```

**Permission:** `org:clients:read`

**Response:** `{ data: Interaction[], meta: { total, limit, offset } }`

Paginated, newest-first. Filterable by `type` param.

#### Create interaction

```
POST /api/clients/{id}/interactions
```

**Permission:** `org:interactions:create`

**Request body:**

```typescript
{
  type: InteractionType;
  direction: 'inbound' | 'outbound' | 'internal';
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}
```

**Idempotency:** Supports `Idempotency-Key` header for offline queue replay.

**iPad usage:** Logging notes, session events, fitting completions to the timeline.

#### Update interaction

```
PATCH /api/clients/{id}/interactions/{interactionId}
```

**Permission:** `org:interactions:create`

**Request body:** Partial (title, body, metadata).

---

### 8. Preferences

#### Get preferences

```
GET /api/clients/{id}/preferences
```

**Permission:** `org:clients:read`

**Response:** `{ data: ClientPreferences }`

#### Update preferences

```
PUT /api/clients/{id}/preferences
```

**Permission:** `org:clients:write`

**Request body:** Full `ClientPreferences.stated` object (replaces entirely).

**iPad usage:** Editable in the "Preferences" section of CLI-02 profile.

---

### 9. Enrichment (Fit Profile)

#### Get enrichment

```
GET /api/clients/{id}/enrichment
```

**Permission:** `org:clients:read`

**Response:** `{ data: ClientEnrichment }`

#### Update enrichment

```
PUT /api/clients/{id}/enrichment
```

**Permission:** `org:clients:write`

**Request body:** Full or partial enrichment fields.

**iPad usage:** Editable in the "Clinical" tab of CLI-02 profile, and in the session context panel (SES-01).

---

### 10. Orders

```
GET /api/clients/{id}/orders
```

**Permission:** `org:clients:read`

**Response:** Order history from Shopify projection.

```typescript
interface ClientOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalPrice: number;          // Cents
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: {
    productId: string;
    variantId: string;
    title: string;
    quantity: number;
    price: number;
    imageUrl: string | null;
  }[];
}
```

**iPad usage:** "History" tab on CLI-02 showing purchase history.

---

### 11. Prescriptions

```
GET /api/clients/{id}/prescriptions
```

**Permission:** `org:clients:read`

**Response:** Rx records linked to this client.

```typescript
interface Prescription {
  id: string;
  clientId: string;
  type: 'single_vision' | 'progressive' | 'bifocal' | 'reading';
  sphereOD: number | null;
  sphereOS: number | null;
  cylinderOD: number | null;
  cylinderOS: number | null;
  axisOD: number | null;
  axisOS: number | null;
  addOD: number | null;
  addOS: number | null;
  pd: number | null;
  prescribedBy: string | null;
  prescribedAt: string | null;
  expiresAt: string | null;
  verified: boolean;
  verifiedBy: string | null;
  createdAt: string;
}
```

**iPad usage:** "Clinical" tab on CLI-02, and during Rx pipeline flows.

---

### 12. Wishlist

```
GET /api/clients/{id}/wishlist
```

**Permission:** `org:clients:read`

**Response:** Products the client has wishlisted or been recommended.

```typescript
interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  title: string;
  imageUrl: string | null;
  price: number;
  addedBy: 'client' | 'staff';
  addedAt: string;
  source: 'fitting' | 'browse' | 'recommendation' | 'ai_styler';
  notes: string | null;
}
```

**iPad usage:** Shown on CLI-02 profile, and used during fitting sessions for shortlist management.

---

### 13. Wishlist Groups (Multi-Pair)

#### List groups

```
GET /api/clients/{id}/wishlist/groups
```

**Permission:** `org:clients:read`

#### Create group

```
POST /api/clients/{id}/wishlist/groups
```

**Permission:** `org:multi_pair:recommend`

#### Delete group

```
DELETE /api/clients/{id}/wishlist/groups/{groupId}
```

**Permission:** `org:multi_pair:recommend`

**iPad usage:** Multi-pair insurance recommendations flow.

---

### 14. Segments

```
GET /api/clients/{id}/segments
```

**Permission:** `org:clients:read`

**Response:** Which segments this client belongs to.

```typescript
interface SegmentMembership {
  id: string;
  name: string;
  description: string | null;
  memberSince: string;
}
```

**iPad usage:** Displayed as tags/badges on CLI-02 profile (staff mode only).

---

### 15. Product Interactions

#### List product interactions

```
GET /api/clients/{id}/product-interactions
```

**Permission:** `org:clients:read`

**Response:** History of products tried, liked, or rejected.

```typescript
interface ProductInteraction {
  id: string;
  productId: string;
  variantId: string | null;
  type: 'tried' | 'liked' | 'loved' | 'rejected';
  sessionId: string | null;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
}
```

#### Create product interaction

```
POST /api/clients/{id}/product-interactions
```

**Permission:** `org:interactions:create`

**Request body:**

```typescript
{
  productId: string;
  variantId?: string;
  type: 'tried' | 'liked' | 'loved' | 'rejected';
  sessionId?: string;
  notes?: string;
}
```

**Idempotency:** Supports `Idempotency-Key` header.

**iPad usage:** Logged automatically when SA assigns a verdict in fitting mode (FIT-01/FIT-02).

---

### 16. Try-On Sessions

#### List sessions

```
GET /api/clients/{id}/tryon-sessions
```

**Permission:** `org:clients:read`

**Response:** All fitting/try-on sessions for this client.

```typescript
interface TryOnSession {
  id: string;
  clientId: string;
  staffId: string;
  staffName: string;
  startedAt: string;
  endedAt: string | null;
  outcome: 'purchased' | 'booked_next' | 'shortlist_review' | 'left_empty' | null;
  frameCount: number;
  photoCount: number;
  notes: string | null;
  createdAt: string;
}
```

#### Create session

```
POST /api/clients/{id}/tryon-sessions
```

**Permission:** `org:interactions:create`

**Idempotency:** Supports `Idempotency-Key` header.

**iPad usage:** Created when SA starts a fitting session (SES-01 → FIT-01).

---

### 17. Insurance Profile

#### Get insurance

```
GET /api/admin/multi-pair/insurance?customerId={id}
```

**Permission:** `org:multi_pair:read`

**Response:**

```typescript
interface InsuranceProfile {
  id: string;
  customerId: string;
  provider: string;
  policyNumber: string | null;
  coverageAmount: number | null;     // Cents per period
  pairsAllowed: number;              // Default: 2
  pairsUsed: number;                 // Default: 0
  renewalDate: string | null;        // ISO 8601
  notes: string | null;              // Coordination of benefits, etc.
  createdAt: string;
  updatedAt: string;
}
```

**iPad usage:** Overview tab → Insurance card. Also feeds Multi-pair suggestions.

#### Create insurance

```
POST /api/admin/multi-pair/insurance
```

**Permission:** `org:multi_pair:manage`

**Request body:**

```typescript
{
  customerId: string;
  provider: string;              // Required
  policyNumber?: string;
  coverageAmount?: number;       // Cents
  pairsAllowed?: number;         // Default: 2
  pairsUsed?: number;            // Default: 0
  renewalDate?: string;          // ISO 8601
  notes?: string;
}
```

#### Update insurance

```
PUT /api/admin/multi-pair/insurance/{id}
```

**Permission:** `org:multi_pair:manage`

**Request body:** Same as create (partial update).

**iPad usage:** Overview tab → Insurance card "Add" / edit actions. Coverage summary computes client-side from these fields:
- Pairs remaining = pairsAllowed − pairsUsed
- Coverage remaining = coverageAmount (shown as-is)
- Days until renewal = renewalDate − today

---

### 18. Lifestyle Questionnaire

#### Get questionnaire answers

```
GET /api/admin/multi-pair/questionnaires?customerId={id}
```

**Permission:** `org:multi_pair:read`

**Response:**

```typescript
interface LifestyleQuestionnaire {
  id: string;
  customerId: string;
  answers: {
    primaryUse: string[];            // Multi-select: office, driving, reading, sports, all_day, social
    screenTime: string | null;       // Single: under_2h, 2_5h, 5_8h, 8h_plus
    outdoorTime: string | null;      // Single: rarely, weekends, daily, works_outdoors
    drivingFrequency: string | null; // Single: daily, few_times_week, weekends, rarely
    lightSensitivity: string | null; // Single: very, somewhat, not_particularly, bright_sun_only
    secondPairStyles: string[];      // Multi-select: bold, classic, sporty, lightweight, trendy
    budgetRange: string | null;      // Single: under_200, 200_400, 400_600, 600_plus, insurance_covers
  };
  completedAt: string;
  completedBy: string;              // Staff user ID
  mode: 'staff' | 'client';        // How it was filled (fast mode vs guided)
}
```

**iPad usage:** Overview tab → Lifestyle card. Feeds Multi-pair suggestions + AI Stylist.

#### Save questionnaire

```
POST /api/admin/multi-pair/questionnaires
```

**Permission:** `org:multi_pair:recommend`

**Request body:**

```typescript
{
  customerId: string;
  answers: {
    primaryUse: string[];
    screenTime?: string;
    outdoorTime?: string;
    drivingFrequency?: string;
    lightSensitivity?: string;
    secondPairStyles?: string[];
    budgetRange?: string;
  };
  mode: 'staff' | 'client';
}
```

**iPad usage:** Lifestyle sheet — both staff fast mode (all 7 at once) and client guided mode (one-by-one).

---

### 19. Multi-pair Recommendations

#### Generate recommendations

```
GET /api/admin/multi-pair/recommend?customerId={id}
```

**Permission:** `org:multi_pair:recommend`

**Response:**

```typescript
interface MultiPairRecommendation {
  pairs: {
    pairNumber: number;              // 2, 3, 4...
    purpose: string;                 // "Office / screen", "Driving / sun"
    reasoning: string;               // Why this pair, why these lenses
    product: {
      productId: string;
      title: string;
      imageUrl: string;
      price: number;                 // Cents
    } | null;
    lensType: string;                // "blue-light single vision", "polarized Rx sun"
    estimatedCost: number;           // Cents (frame + lenses)
    outOfPocket: number | null;      // Cents, null if no insurance on file
  }[];
  inputsUsed: {
    lifestyle: boolean;
    rx: boolean;
    insurance: boolean;
  };
  generatedAt: string;
}
```

**iPad usage:** Multi-pair suggestions sheet. Each recommendation shows product + reasoning + cost. When insurance is on file, shows out-of-pocket math.

#### Accept recommendation

```
POST /api/admin/multi-pair/accept
```

**Permission:** `org:multi_pair:recommend`

**Request body:**

```typescript
{
  customerId: string;
  productId: string;
  pairNumber: number;
  action: 'wishlist' | 'session_tray';
}
```

**iPad usage:** "Add to wishlist" or "Add to session" buttons on each recommendation card.

---

### 20. Prescriptions (Create)

```
POST /api/admin/prescriptions
```

**Permission:** `org:prescriptions:write`

**Request body:**

```typescript
{
  clientId: string;
  type: 'single_vision' | 'progressive' | 'bifocal' | 'reading';
  sphereOD?: number;
  sphereOS?: number;
  cylinderOD?: number;
  cylinderOS?: number;
  axisOD?: number;
  axisOS?: number;
  addOD?: number;
  addOS?: number;
  pd?: number;
  pdOD?: number;               // Monocular PD
  pdOS?: number;               // Monocular PD
  segHeight?: number;          // For progressive/bifocal
  prescribedBy?: string;       // Doctor name
  prescribedAt?: string;       // Exam date ISO
  expiresAt?: string;          // Auto: +24 months from prescribedAt
  source: 'manual' | 'photo' | 'import';
  photoId?: string;            // Media ID if photographed
}
```

**Response:** `{ data: Prescription }` — saved with `verified: false`.

**Verification flow:** Saved as Unverified. A licensed optician reviews in Foundry admin and marks Verified. Only verified Rx can enter the Rx pipeline for lens ordering (OOAQ regulation).

**iPad usage:** Clinical tab → "+ Add Rx" → Rx sheet.

---

### 21. AI Stylist

```
POST /api/clients/{id}/ai-styler
```

**Permission:** `org:clients:read` + `org:products:read`

**Request body:**

```typescript
{
  occasion?: string;           // e.g. "everyday", "sport", "formal"
  budget?: { min: number; max: number };
  constraints?: string[];      // e.g. ["no-metal", "wide-fit"]
}
```

**Response:** AI-generated recommendations with reasoning.

```typescript
{
  thought: string;             // Explanation of the AI's reasoning
  recommendations: {
    productId: string;
    title: string;
    imageUrl: string;
    score: number;             // 0-100 relevance
    reason: string;            // Why this was recommended
  }[];
}
```

**iPad usage:** On-demand in SES-01 session workspace. SA can invoke with constraints, results appear as tappable chips.

---

### 18. Suggestions (Scored)

```
GET /api/clients/{id}/suggestions?limit=12
```

**Permission:** `org:products:read`

**Response:** Pre-computed product suggestions scored against this client's profile/preferences.

```typescript
interface Suggestion {
  productId: string;
  title: string;
  imageUrl: string;
  score: number;               // 0-100
  reasons: string[];           // e.g. ["Matches face shape", "Preferred brand"]
  fitRating: 'good' | 'fair' | 'poor';
}
```

**iPad usage:** Powers the "Best match" sort in the product browser (PRD-01) during a session.

---

### 19. Client Links (Relationships)

```
GET /api/clients/{id}/links
```

**Permission:** `org:clients:read`

**Response:** Relationships between clients.

```typescript
interface ClientLink {
  id: string;
  linkedClientId: string;
  linkedClientName: string;
  relationship: 'spouse' | 'parent' | 'child' | 'friend' | 'colleague' | 'referrer' | 'referred';
  createdAt: string;
}
```

**iPad usage:** "Relationships" tab on CLI-02 profile. Allows SA to quickly navigate to related clients.

---

## Offline Behaviour

### Cached locally (WatermelonDB)

| Data | Refresh |
|---|---|
| Last 30 client profiles viewed | On access |
| Today's appointment clients | Daily sync |
| Active session client | Real-time (in-session) |

### Write queue (works offline)

| Operation | Queues offline? |
|---|---|
| Update client profile | ✅ Yes (newest-wins conflict resolution) |
| Create interaction | ✅ Yes (with Idempotency-Key) |
| Create product interaction | ✅ Yes (with Idempotency-Key) |
| Create try-on session | ✅ Yes (with Idempotency-Key) |
| Update enrichment | ✅ Yes |
| Update preferences | ✅ Yes |
| Save lifestyle questionnaire | ✅ Yes |
| Save insurance profile | ✅ Yes |
| **Create new client** | ❌ Blocks — requires duplicate check |
| **Create prescription** | ❌ Blocks — requires server validation |
| **Generate multi-pair** | ❌ Blocks — requires AI computation |

### Conflict resolution

- **Newest-wins:** If an offline edit and a web edit collide, the later timestamp wins.
- **Exception:** Session objects always win (SA-owned, no concurrent edits).
- **Notification:** iPad shows a non-blocking toast when an edit is superseded.

---

## Permissions Matrix

| Permission | Grants |
|---|---|
| `org:clients:read` | View client list, profile, enrichment, preferences, orders, prescriptions, wishlist, segments, interactions, product interactions, sessions, links, suggestions |
| `org:clients:write` | Create/update client profile, update enrichment, update preferences |
| `org:interactions:create` | Create/update interactions, product interactions, try-on sessions |
| `org:products:read` | Access AI styler, suggestions, product details |
| `org:multi_pair:read` | View insurance profile, lifestyle questionnaire answers |
| `org:multi_pair:recommend` | Generate multi-pair recommendations, save lifestyle questionnaire, accept suggestions, create/delete wishlist groups |
| `org:multi_pair:manage` | Create/update insurance profiles |
| `org:prescriptions:read` | View prescriptions |
| `org:prescriptions:write` | Create/update prescriptions, verify Rx |

---

## Rate Limits

| Surface | Limit |
|---|---|
| `tablet` | 200 req/min |
| `web` | 120 req/min |

When rate-limited: respect `Retry-After` header. Back off, don't retry immediately.

---

## Privacy Mode Impact

The API returns all data regardless of privacy mode. **The iPad app is responsible for filtering what's displayed** based on the current view mode:

| Field | Staff mode | Client-visible mode |
|---|---|---|
| Name, avatar | ✅ | ✅ |
| Contact info | ✅ | ✅ |
| Preferences (stated) | ✅ | ✅ |
| Enrichment (fit profile) | ✅ | ✅ |
| Lifestyle answers | ✅ | ✅ (read-only, no edit) |
| Wishlist | ✅ | ✅ (no prices) |
| Tags | ✅ | ❌ Hidden |
| Internal notes | ✅ | ❌ Hidden |
| Order history ($ amounts) | ✅ | ❌ Hidden |
| Lifetime value / AOV | ✅ | ❌ Hidden |
| Credit balance ($ amount) | ✅ | Shows "credits available" only |
| Segments | ✅ | ❌ Hidden |
| Prescriptions | ✅ | ❌ Hidden |
| Insurance profile | ✅ | ❌ Hidden |
| Multi-pair suggestions | ✅ | ❌ Hidden |
| History timeline | ✅ | ❌ Hidden |
| Client relationships | ✅ | ❌ Hidden |
| Return rate | ✅ | ❌ Hidden |

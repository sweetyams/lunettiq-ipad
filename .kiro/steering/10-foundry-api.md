---
inclusion: manual
---
# Foundry API Contract

Reference: "use #10-foundry-api"

## Base Configuration

```typescript
// src/api/client.ts
const BASE_URL = __DEV__
  ? 'http://lunettiq.localhost:4000'
  : 'https://lunettiq.bentspline.com';

const SURFACE = 'tablet';  // Always — identifies iPad in audit logs
```

## Authentication

Every request includes:
```
Authorization: Bearer <clerk_session_token>
X-Found-Surface: tablet
Content-Type: application/json
```

**Both headers are required.** Without `X-Found-Surface: tablet`, the request falls through to the cookie-based auth path (designed for browsers) and fails with 401.

Get the token via `@clerk/clerk-expo`:
```typescript
import { useAuth } from '@clerk/clerk-expo';

const { getToken } = useAuth();
const token = await getToken();
// NEVER cache the token string — it expires in ~60 seconds
// getToken() returns a fresh JWT every call (Clerk handles refresh internally)
```

### 401 Retry Logic

```typescript
// On 401: wait 1s, call getToken() again (Clerk native auto-refreshes), retry once
if (result.error?.code === 'UNAUTHORIZED') {
  await new Promise(r => setTimeout(r, 1000));
  const freshToken = await getToken();
  if (!freshToken) throw new AuthExpiredError(); // truly expired → redirect to login
  // retry with freshToken...
}
```

No `skipCache` option exists in Clerk Expo. A short delay + second `getToken()` call is the native pattern.

## Response Shape (every endpoint)

```typescript
// Success
{ data: T, error: null, meta: { requestId: string, total?: number, limit?: number, offset?: number } }

// Error
{ data: null, error: { code: string, message: string, details?: unknown }, meta: { requestId: string } }
```

### Error Codes

| Code | HTTP | Meaning | iPad action |
|------|------|---------|-------------|
| `UNAUTHORIZED` | 401 | Token expired or invalid | Wait 1s → `getToken()` → retry once. If still 401 → redirect to login. |
| `FORBIDDEN` | 403 | Role insufficient | Show "Permission denied" toast. Don't retry. |
| `NO_CONTEXT` | 400 | Tenant not resolved | Check base URL matches the tenant. |
| `VALIDATION` | 400 | Bad input (Zod) | Show field errors from `error.details`. |
| `NOT_FOUND` | 404 | Resource or module disabled | Handle gracefully (remove from local cache). |
| `RATE_LIMITED` | 429 | Too many requests | Back off for `Retry-After` header seconds. |
| `INTERNAL` | 500 | Server error | Queue for retry (sync queue pattern). |

## Path Prefix Convention

Modules that existed before the `/admin/` convention was standardized don't have the prefix. Newer modules do. All work identically with Bearer JWT auth.

| Prefix | Modules |
|--------|---------|
| `/api/` (no prefix) | clients, inventory, loyalty, media, second-sight, custom-designs, scheduling (admin ops) |
| `/api/admin/` | rx-pipeline, rx-approvals, multi-pair, receipts, push, prescriptions, product-families, product-enhancements, recommendations |
| `/api/storefront/` | products, scheduling (public reads), configurator, settings, locations, filters |

## Core Endpoints

### Clients (`/api/clients/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/clients?q=&tag=&sort=&limit=&offset=` | `org:clients:read` | Fuzzy search (pg_trgm) |
| POST | `/api/clients` | `org:clients:write` | Create new client |
| GET | `/api/clients/{id}` | `org:clients:read` | Full profile |
| PATCH | `/api/clients/{id}` | `org:clients:write` | Update fields |
| GET | `/api/clients/{id}/interactions?limit=50` | `org:clients:read` | Timeline (paginated) |
| POST | `/api/clients/{id}/interactions` | `org:interactions:create` | Log interaction |
| PATCH | `/api/clients/{id}/interactions/{iid}` | `org:interactions:create` | Update interaction |
| GET | `/api/clients/{id}/preferences` | `org:clients:read` | Stated + derived preferences |
| PUT | `/api/clients/{id}/preferences` | `org:clients:write` | Update preferences |
| GET | `/api/clients/{id}/enrichment` | `org:clients:read` | Face shape, frame width, notes |
| PUT | `/api/clients/{id}/enrichment` | `org:clients:write` | Update enrichment |
| GET | `/api/clients/{id}/orders` | `org:clients:read` | Order history |
| GET | `/api/clients/{id}/prescriptions` | `org:clients:read` | Rx records |
| GET | `/api/clients/{id}/wishlist` | `org:clients:read` | Wishlist items |
| GET | `/api/clients/{id}/segments` | `org:clients:read` | Segment memberships |
| GET | `/api/clients/{id}/product-interactions` | `org:clients:read` | Tried/liked history |
| POST | `/api/clients/{id}/product-interactions` | `org:interactions:create` | Log try-on/like |
| GET | `/api/clients/{id}/tryon-sessions` | `org:clients:read` | Sessions list |
| POST | `/api/clients/{id}/tryon-sessions` | `org:interactions:create` | Create session |
| POST | `/api/clients/{id}/ai-styler` | `org:clients:read` + `org:products:read` | AI recommendations |
| GET | `/api/clients/{id}/suggestions?limit=12` | `org:products:read` | Scored suggestions |
| GET | `/api/clients/{id}/links` | `org:clients:read` | Client relationships |
| GET | `/api/clients/{id}/wishlist/groups` | `org:clients:read` | Multi-pair wishlist groups |
| POST | `/api/clients/{id}/wishlist/groups` | `org:multi_pair:recommend` | Create group |
| DELETE | `/api/clients/{id}/wishlist/groups/{groupId}` | `org:multi_pair:recommend` | Remove group |
| GET | `/api/clients/field-config` | `org:clients:read` | Field configuration |
| GET | `/api/clients/duplicates` | `org:clients:read` | Duplicate candidates |

### Products (`/api/storefront/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/storefront/products` | Public | Full catalogue (cached 60s) |
| GET | `/api/storefront/products/{id}` | Public | Product detail |
| GET | `/api/storefront/product-families/siblings/{handle}` | Public | Colour siblings |
| GET | `/api/storefront/product-families/by-product/{id}` | Public | Family for a product |
| GET | `/api/admin/product-families` | `org:products:read` | Full family list |
| GET | `/api/admin/product-enhancements/{productId}` | `org:products:read` | Frame specs/content |

### Inventory (`/api/inventory/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/inventory?locationId={loc}` | `org:inventory:read` | Stock at location |
| GET | `/api/inventory/{id}` | `org:inventory:read` | Single level detail |
| POST | `/api/inventory/protections` | `org:inventory:hold` | Create hold (try_on_hold, rx_in_progress) |
| PUT | `/api/inventory/protections/{id}` | `org:inventory:hold` | Update/extend hold |
| DELETE | `/api/inventory/protections/{id}` | `org:inventory:hold` | Release hold |
| GET | `/api/inventory/protections` | `org:inventory:read` | List active holds |
| POST | `/api/inventory/scan/resolve` | `org:inventory:read` | Barcode → product |

### Appointments

**Public reads** (`/api/storefront/scheduling/`):

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/storefront/scheduling/appointments?date=&locationId=` | Public | Today's schedule |
| GET | `/api/storefront/scheduling/services` | Public | Appointment types |
| GET | `/api/storefront/scheduling/staff` | Public | Staff on duty |

**Admin ops** (`/api/scheduling/`):

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| PATCH | `/api/scheduling/{id}/transition` | `org:scheduling:write` | Check-in, no-show, status changes |

### Prescriptions (`/api/admin/prescriptions/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/prescriptions` | `org:prescriptions:read` | List prescriptions |
| GET | `/api/admin/prescriptions/{id}` | `org:prescriptions:read` | Detail |
| POST | `/api/admin/prescriptions` | `org:prescriptions:write` | Create Rx record |
| PATCH | `/api/admin/prescriptions/{id}` | `org:prescriptions:write` | Update/verify |

### Rx Pipeline (`/api/admin/rx-pipeline/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/rx-pipeline/orders` | `org:rx-pipeline:read` | Rx order list |
| POST | `/api/admin/rx-pipeline/orders` | `org:rx-pipeline:write` | Create Rx order |
| GET | `/api/admin/rx-pipeline/orders/{id}` | `org:rx-pipeline:read` | Order detail |
| PATCH | `/api/admin/rx-pipeline/orders/{id}` | `org:rx-pipeline:write` | Update state/measurements |
| GET | `/api/admin/rx-pipeline/counts` | `org:rx-pipeline:read` | Pipeline counts by state |

### Rx Approvals (`/api/admin/rx-approvals/`)

State machine: draft → submitted → in_review → approved/rejected/returned.

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/rx-approvals` | `org:rx:write` | Submit for approval |
| GET | `/api/admin/rx-approvals?status=submitted` | `org:rx:verify` | Pending queue |
| GET | `/api/admin/rx-approvals/summary` | `org:rx:verify` | Counts by status |
| GET | `/api/admin/rx-approvals/{id}` | `org:rx:verify` | Detail + snapshot |
| POST | `/api/admin/rx-approvals/{id}/claim` | `org:rx:verify` | Claim for review |
| POST | `/api/admin/rx-approvals/{id}/release` | `org:rx:verify` | Release back to queue |
| POST | `/api/admin/rx-approvals/{id}/return` | `org:rx:verify` | Return for corrections |
| POST | `/api/admin/rx-approvals/{id}/reject` | `org:rx:verify` | Reject |
| POST | `/api/admin/rx-approvals/{id}/sign-off` | `org:rx:sign_off` | Approve (requires credential) |
| POST | `/api/admin/rx-approvals/{id}/corrections` | `org:rx:write` | Submit corrections |
| POST | `/api/admin/rx-approvals/{id}/heartbeat` | `org:rx:verify` | Keep review alive |
| GET | `/api/admin/rx-approvals/{id}/checklist` | `org:rx:write` | Pre-submit checklist |
| GET | `/api/admin/rx-approvals/readiness?orderId={id}` | `org:rx:write` | Readiness gate (returns `ready: bool` + checks array) |

### Multi-Pair Recommendations (`/api/admin/multi-pair/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/multi-pair/recommend?customerId={id}` | `org:multi_pair:recommend` | Generate recommendations |
| POST | `/api/admin/multi-pair/accept` | `org:multi_pair:recommend` | Accept recommendation |
| GET | `/api/admin/multi-pair/questionnaires?customerId={id}` | `org:multi_pair:read` | Lifestyle questionnaire |
| POST | `/api/admin/multi-pair/questionnaires` | `org:multi_pair:recommend` | Save answers |
| GET | `/api/admin/multi-pair/insurance?customerId={id}` | `org:multi_pair:read` | Insurance profile |
| POST | `/api/admin/multi-pair/insurance` | `org:multi_pair:manage` | Save insurance |
| PUT | `/api/admin/multi-pair/insurance/{id}` | `org:multi_pair:manage` | Update insurance |
| GET | `/api/admin/multi-pair/settings` | `org:multi_pair:manage` | Module settings |

### Insurance Receipts (`/api/admin/receipts/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/receipts?customerId={id}` | `org:receipts:read` | List receipts |
| GET | `/api/admin/receipts/{id}` | `org:receipts:read` | Detail + signed PDF URL |
| POST | `/api/admin/receipts/{id}/send` | `org:receipts:write` | Email to client |
| POST | `/api/admin/receipts/{id}/regenerate` | `org:receipts:write` | Regenerate PDF |

### Loyalty Credits (`/api/loyalty/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/loyalty/credits/{customerId}` | `org:loyalty:read` | Balance + ledger |
| POST | `/api/loyalty/credits/{customerId}` | `org:loyalty:write` | Issue/deduct credits |

POST body: `{ "amount": 500, "reason": "Courtesy credit", "type": "manual" }`

### Second Sight (`/api/second-sight/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/second-sight` | `org:second-sight:write` | Create intake |
| GET | `/api/second-sight` | `org:second-sight:read` | List intakes |
| GET | `/api/second-sight/{id}` | `org:second-sight:read` | Intake detail |
| PATCH | `/api/second-sight/{id}` | `org:second-sight:write` | Grade + status |

### Custom Designs (`/api/custom-designs/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/custom-designs` | `org:custom-designs:write` | Create design |
| GET | `/api/custom-designs` | `org:custom-designs:read` | List designs |
| GET | `/api/custom-designs/{id}` | `org:custom-designs:read` | Detail |
| PATCH | `/api/custom-designs/{id}` | `org:custom-designs:write` | Update status |

### Media — Photos (`/api/media/`)

**iPad camera photos use multipart upload directly to Foundry:**

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/media/upload` | `org:media:write` | Multipart upload (Vercel Blob) |

Server normalizes: strips EXIF, auto-rotate, sRGB, caps 3200px. Returns media record with URL immediately — no confirm step.

```typescript
const formData = new FormData();
formData.append('file', {
  uri: photo.localUri,
  type: 'image/jpeg',
  name: `session-${sessionId}-${Date.now()}.jpg`,
});
formData.append('context', 'fitting-session');
formData.append('sessionId', sessionId);
formData.append('clientId', clientId);

const result = await fetch(`${BASE_URL}/api/media/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Found-Surface': 'tablet',
    // Do NOT set Content-Type — let fetch set multipart boundary
  },
  body: formData,
});
// Returns: { data: { id, url, key }, error: null }
```

**For PDFs/receipts (presigned URL pattern):**

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/media/upload-url` | `org:media:write` | Get presigned URL for large files |

### Push Notifications (`/api/admin/push/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/push/register` | Any authenticated staff | Register Expo push token |
| DELETE | `/api/admin/push/register` | Any authenticated staff | Deregister on logout |

POST body: `{ "token": "ExponentPushToken[...]", "platform": "ios", "deviceName": "iPad Pro Store-1" }`

Call on every login (idempotent — ON CONFLICT DO NOTHING).

### Configurator (`/api/storefront/configurator/`)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/storefront/configurator/resolve?productId={id}` | Public | Resolve flow for a frame |
| GET | `/api/storefront/configurator/lens-colours` | Public | Available lens colours |
| GET | `/api/storefront/configurator/snapshot` | Public | Saved configuration |

### Settings & Taxonomy

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/storefront/settings` | Public | Project settings (cached) |
| GET | `/api/storefront/locations` | Public | Store locations |
| GET | `/api/storefront/filters` | Public | Product filter taxonomy |

## Idempotency (Offline Queue)

For mutating requests from the sync queue, include:
```
Idempotency-Key: <local_uuid_from_sync_queue>
```

- First request: executes normally, caches response for 24h
- Duplicate request (same key): returns cached response (no re-execution)
- Response header `X-Idempotent-Replay: true` indicates a cached replay
- Only 2xx responses are cached. Errors are NOT cached (retries re-execute).

Endpoints with idempotency wired:
- `POST /api/clients/{id}/interactions`
- `POST /api/clients/{id}/product-interactions`
- `POST /api/clients/{id}/tryon-sessions`
- `POST /api/inventory/protections`

## Rate Limits

Tablet surface gets higher limits:

| Surface | Limit |
|---------|-------|
| `tablet` | 200 req/min |
| `web` | 120 req/min |

When rate limited: `Retry-After` header (seconds). Back off, don't retry immediately.

## Location Scoping

The iPad's location is resolved **server-side** from the staff member's profile. No location header needed. For inventory queries that accept `locationId`, pass it from locally-stored staff config (populated at login).

## API Client Pattern

```typescript
// src/api/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

class FoundryAPI {
  private getToken: (() => Promise<string | null>) | null = null;

  setTokenGetter(fn: () => Promise<string | null>) {
    this.getToken = fn;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken?.();
    if (!token) throw new AuthExpiredError();

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Found-Surface': SURFACE,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (json.error?.code === 'UNAUTHORIZED') {
      // Token likely expired mid-request — wait, get fresh, retry once
      await new Promise(r => setTimeout(r, 1000));
      const freshToken = await this.getToken?.();
      if (!freshToken) throw new AuthExpiredError();

      const retry = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${freshToken}`,
          'X-Found-Surface': SURFACE,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const retryJson = await retry.json();
      if (retryJson.error) throw new APIError(retryJson.error.code, retryJson.error.message);
      return retryJson.data;
    }

    if (json.error) throw new APIError(json.error.code, json.error.message);
    return json.data;
  }

  get<T>(path: string, opts?: { params?: Record<string, string> }): Promise<T> {
    const url = opts?.params ? `${path}?${new URLSearchParams(opts.params)}` : path;
    return this.request('GET', url);
  }

  post<T>(path: string, body: unknown): Promise<T> { return this.request('POST', path, body); }
  patch<T>(path: string, body: unknown): Promise<T> { return this.request('PATCH', path, body); }
  put<T>(path: string, body: unknown): Promise<T> { return this.request('PUT', path, body); }
  delete<T>(path: string): Promise<T> { return this.request('DELETE', path); }
}

export const api = new FoundryAPI();
```

## Rules

1. **Never call Shopify directly.** All data comes through Foundry.
2. **Always include `X-Found-Surface: tablet`.** Audit logs use this. Without it → 401.
3. **Handle 401 → wait 1s → getToken() → retry once.** If still 401 → redirect to login.
4. **Handle 404 → module disabled.** Feature not available for this tenant.
5. **Handle 403 → permission denied.** SA role doesn't have access. Show toast.
6. **Handle 429 → back off.** Respect `Retry-After` header.
7. **Offline fallback.** If fetch fails with network error, read from WatermelonDB cache.
8. **Never cache credentials.** Token is always fresh from Clerk's `getToken()`.
9. **Media uploads use multipart POST** to `/api/media/upload`. No presigned URL for photos. No confirm step.
10. **Push registration on every login.** `POST /api/admin/push/register` is idempotent.

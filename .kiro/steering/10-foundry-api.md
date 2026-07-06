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

Get the token via `@clerk/clerk-expo`:
```typescript
import { useAuth } from '@clerk/clerk-expo';

const { getToken } = useAuth();
const token = await getToken();
```

## Response Shape (standard across all endpoints)

```typescript
// Success
{ data: T, error: null, meta: { requestId: string, total?: number, limit?: number, offset?: number } }

// Error
{ data: null, error: { code: string, message: string, details?: unknown }, meta: { requestId: string } }
```

## Core Endpoints

### Clients

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/clients?q=&tag=&sort=&limit=&offset=` | `org:clients:read` | Fuzzy search (pg_trgm) |
| GET | `/api/admin/clients/{id}` | `org:clients:read` | Full profile + metafields |
| PATCH | `/api/admin/clients/{id}` | `org:clients:update` | Update fields |
| POST | `/api/admin/clients` | `org:clients:create` | Create new client |
| GET | `/api/admin/clients/{id}/suggestions?limit=12` | `org:products:read` | Scored recommendations |

### Products

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/products?q=&type=&vendor=&material=&limit=` | `org:products:read` | Search + filters |
| GET | `/api/admin/products/{id}` | `org:products:read` | Detail + variants + inventory |

### Appointments

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/appointments?date=&locationId=&staffId=` | `org:appointments:read` | List |
| PATCH | `/api/admin/appointments/{id}` | `org:appointments:update` | Status transitions |

### Interactions (CRM timeline)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/interactions` | `org:interactions:create` | Log note, call, visit |
| POST | `/api/admin/product-interactions` | `org:products:read` | Log tried_on, liked, etc. |

### Second Sight

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/second-sight` | `org:second_sight:write` | Create intake |
| PATCH | `/api/admin/second-sight/{id}` | `org:second_sight:approve_grade` | Grade + credit |

### Custom Designs

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/custom-designs` | `org:custom_designs:write` | Create design |
| PATCH | `/api/admin/custom-designs/{id}` | `org:custom_designs:write` | Update status |

### Media (R2 Upload)

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| POST | `/api/admin/media/upload-url` | `org:media:write` | Get presigned R2 URL |

### Loyalty

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/api/admin/loyalty/credits/{customerId}` | `org:loyalty:read` | Credit balance + history |
| POST | `/api/admin/loyalty/credits/{customerId}` | `org:loyalty:write` | Issue credit |

## API Client Pattern

```typescript
// src/api/client.ts
import { useAuth } from '@clerk/clerk-expo';
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
    if (json.error) throw new APIError(json.error.code, json.error.message);
    return json.data;
  }

  get<T>(path: string, opts?: { params?: Record<string, string> }): Promise<T> {
    const url = opts?.params ? `${path}?${new URLSearchParams(opts.params)}` : path;
    return this.request('GET', url);
  }

  post<T>(path: string, body: unknown): Promise<T> { return this.request('POST', path, body); }
  patch<T>(path: string, body: unknown): Promise<T> { return this.request('PATCH', path, body); }
  delete<T>(path: string): Promise<T> { return this.request('DELETE', path); }
}

export const api = new FoundryAPI();
```

## Rules

1. **Never call Shopify directly.** All data comes through Foundry.
2. **Always include `X-Found-Surface: tablet`.** Audit logs use this.
3. **Handle 401 → re-auth.** Clerk token expired, prompt biometric re-auth.
4. **Handle 404 → module disabled.** Feature not available for this tenant.
5. **Handle 403 → permission denied.** SA role doesn't have access.
6. **Offline fallback.** If fetch fails with network error, read from WatermelonDB cache.
7. **Never cache credentials.** Token is always fresh from Clerk's `getToken()`.

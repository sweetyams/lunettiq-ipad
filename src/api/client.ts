import { QueryClient } from '@tanstack/react-query';

const BASE_URL = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL
  ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com');

const SURFACE = 'tablet'; // Always — identifies iPad in audit logs

// Dev API key — bypasses Clerk auth, used when token getter returns null
const DEV_API_KEY = __DEV__ ? process.env.EXPO_PUBLIC_FOUNDRY_API_KEY : null;

// Standard Foundry API response shape
interface FoundryResponse<T = unknown> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta: {
    requestId: string;
    total?: number;
    limit?: number;
    offset?: number;
  };
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

class FoundryAPI {
  private getToken: (() => Promise<string | null>) | null = null;

  /** Exposed for multipart uploads that bypass the standard request() method */
  get baseUrl(): string {
    return BASE_URL;
  }

  setTokenGetter(fn: () => Promise<string | null>): void {
    this.getToken = fn;
  }

  /** Get a fresh token for upload workers that need raw fetch */
  async getTokenForUpload(): Promise<string | null> {
    return this.getToken?.() ?? null;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken?.();
    
    if (__DEV__) {
      console.log(`[API] Token: ${token ? `${token.substring(0, 20)}... (${token.length} chars)` : 'NULL'}`);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]!));
          const exp = payload.exp * 1000;
          const now = Date.now();
          console.log(`[API] Token iss: ${payload.iss}, sub: ${payload.sub}`);
          console.log(`[API] Token exp: ${new Date(exp).toISOString()}, now: ${new Date(now).toISOString()}, ${exp > now ? 'VALID' : 'EXPIRED'} (${Math.round((exp - now) / 1000)}s remaining)`);
        } catch {}
      }
    }

    const headers: HeadersInit = {
      'X-Found-Surface': SURFACE,
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (DEV_API_KEY) {
      // Fallback to API key in dev when Clerk token unavailable
      headers['Authorization'] = `Bearer ${DEV_API_KEY}`;
    }

    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    
    if (__DEV__) {
      console.log(`[API] ${method} ${path} → ${response.status} (${text.length} bytes)`);
      if (response.status === 401) {
        console.log(`[API] 401 body: ${text}`);
      }
      if (!text.startsWith('{')) {
        console.warn(`[API] Non-JSON response: ${text.substring(0, 200)}`);
      }
    }

    let json: FoundryResponse<T>;
    try {
      json = JSON.parse(text);
    } catch {
      throw new APIError('PARSE_ERROR', `Expected JSON from ${path}, got: ${text.substring(0, 100)}`);
    }
    
    if (json.error) {
      throw new APIError(json.error.code, json.error.message, json.error.details);
    }
    
    return json.data as T;
  }

  get<T>(path: string, opts?: { params?: Record<string, string> }): Promise<T> {
    const url = opts?.params 
      ? `${path}?${new URLSearchParams(opts.params)}` 
      : path;
    return this.request<T>('GET', url);
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new FoundryAPI();
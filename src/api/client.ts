import { QueryClient } from '@tanstack/react-query';

const BASE_URL = __DEV__
  ? 'http://lunettiq.localhost:4000'
  : 'https://lunettiq.bentspline.com';

const SURFACE = 'tablet'; // Always — identifies iPad in audit logs

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

  setTokenGetter(fn: () => Promise<string | null>): void {
    this.getToken = fn;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getToken?.();
    
    const headers: HeadersInit = {
      'X-Found-Surface': SURFACE,
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json: FoundryResponse<T> = await response.json();
    
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

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new FoundryAPI();
import { useAuth } from '@clerk/clerk-expo';

const BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://lunettiq.vercel.app';

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type HTTPMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestConfig {
  method?: HTTPMethod;
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
}

function buildURL(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export function useApi() {
  const { getToken } = useAuth();

  async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, params } = config;
    const token = await getToken();
    const res = await fetch(buildURL(path, params), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CRM-Surface': 'tablet',
      },
      ...(body && { body: JSON.stringify(body) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new APIError(err.error || `API ${res.status}`, res.status);
    }
    const json = await res.json();
    return json.data ?? json;
  }

  // MARK: - Clients
  const clients = {
    list: (params?: { q?: string; tag?: string; limit?: number; offset?: number }) =>
      request<any[]>('/api/crm/clients', { params }),
    get: (id: string) => request<any>(`/api/crm/clients/${id}`),
    create: (body: { firstName: string; lastName: string; email: string; phone?: string }) =>
      request<any>('/api/crm/clients', { method: 'POST', body }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/crm/clients/${id}`, { method: 'PATCH', body }),
    timeline: (id: string) => request<any[]>(`/api/crm/clients/${id}/timeline`),
    addTimeline: (id: string, body: Record<string, unknown>) =>
      request<any>('/api/crm/interactions', { method: 'POST', body: { shopifyCustomerId: id, ...body } }),
    recommend: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/crm/clients/${id}/recommend`, { method: 'POST', body }),
    suggestions: (id: string, limit = 10) =>
      request<any[]>(`/api/crm/clients/${id}/suggestions`, { params: { limit } }),
    tryOnSessions: (id: string) => request<any[]>(`/api/crm/clients/${id}/tryon-sessions`),
    createTryOn: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/crm/clients/${id}/tryon-sessions`, { method: 'POST', body }),
  };

  // MARK: - Products
  const products = {
    list: (params?: { q?: string; limit?: number; type?: string; material?: string }) =>
      request<any[]>('/api/crm/products', { params }),
    get: (id: string) => request<any>(`/api/crm/products/${id}`),
    search: (params: { q: string; customerId?: string; limit?: number }) =>
      request<any[]>('/api/crm/products/search', { params }),
  };

  // MARK: - Appointments
  const appointments = {
    list: (params?: { date?: string; locationId?: string; staffId?: string }) =>
      request<any[]>('/api/crm/appointments', { params }),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/crm/appointments/${id}`, { method: 'PATCH', body }),
  };

  // MARK: - Second Sight
  const secondSight = {
    list: () => request<any[]>('/api/crm/second-sight'),
    create: (body: Record<string, unknown>) =>
      request<any>('/api/crm/second-sight', { method: 'POST', body }),
    grade: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/crm/second-sight/${id}`, { method: 'PATCH', body }),
  };

  // MARK: - Settings
  const settings = {
    locations: () => request<any[]>('/api/crm/settings/locations'),
    staff: () => request<any[]>('/api/crm/settings/staff'),
  };

  return { request, clients, products, appointments, secondSight, settings };
}

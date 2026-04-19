import { useAuth } from '@clerk/clerk-expo';

const BASE_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://lunettiq.vercel.app';

export function useApi() {
  const { getToken } = useAuth();

  async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-CRM-Surface': 'tablet',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `API ${res.status}`);
    }
    const json = await res.json();
    return json.data ?? json;
  }

  return { apiFetch };
}

/**
 * Client display names for list endpoints that only return a client id
 * (Foundry's scheduling and remote-approval lists). Looks each id up once
 * via `/api/clients/{id}` and caches it for a few minutes.
 */
import { api } from './client';

const NAME_TTL_MS = 5 * 60_000;
const nameCache = new Map<string, { name: string; at: number }>();

export async function lookupClientNames(ids: Iterable<string>): Promise<Map<string, string>> {
  const unique = [...new Set([...ids].filter(Boolean))];
  const now = Date.now();
  const missing = unique.filter((id) => {
    const hit = nameCache.get(id);
    return !hit || now - hit.at > NAME_TTL_MS;
  });
  await Promise.all(
    missing.map(async (id) => {
      try {
        const c = await api.get<{ firstName?: string | null; lastName?: string | null }>(`/api/clients/${id}`);
        const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
        if (name) nameCache.set(id, { name, at: now });
      } catch {
        // A missing name falls back to the caller's default; never fail the list.
      }
    }),
  );
  return new Map(unique.flatMap((id) => {
    const hit = nameCache.get(id);
    return hit ? [[id, hit.name] as [string, string]] : [];
  }));
}

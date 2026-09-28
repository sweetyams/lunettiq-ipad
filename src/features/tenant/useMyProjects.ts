import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { resolveBaseUrl } from './baseUrl';
import { useTenantStore, type Project } from './useTenantStore';

/**
 * Multi-project discovery — `GET /api/account/my-projects`.
 *
 * Contract (locked, see docs/multi-project/00-shared-plan.md §4):
 *  - Call on a project host the user belongs to (NOT a neutral host). The mobile-JWT
 *    middleware 403s if the user isn't a member of the host's tenant. We bootstrap from
 *    the last-known / default project host via `resolveBaseUrl()`.
 *  - Error handling is by HTTP status, not an error code:
 *      200 + projects:[]  → valid login, no memberships  → "no access"
 *      401                → missing/invalid/expired JWT   → re-auth
 *      403                → not a member of host's project → fall back to a known host
 *
 * This is deliberately a raw fetch (not the shared api.request()) because we need the
 * HTTP status and a per-call host, both of which the standard client abstracts away.
 */

const PATH = '/api/account/my-projects';

export type MyProjectsOutcome =
  | { status: 'ok'; projects: Project[] }
  | { status: 'no-access' } // 200 with empty list
  | { status: 'unauthorized' } // 401 — re-auth
  | { status: 'wrong-project' } // 403 — bootstrap host membership mismatch
  | { status: 'error'; message: string };

interface MyProjectsResponse {
  data: { clerkUserId: string; projects: Project[] } | null;
  error: { code: string; message: string } | null;
}

/**
 * Fetch the caller's project memberships from a specific host.
 * `baseUrl` defaults to the active/last-known/default project host.
 */
export async function fetchMyProjects(
  getToken: () => Promise<string | null>,
  baseUrl: string = resolveBaseUrl()
): Promise<MyProjectsOutcome> {
  let token: string | null = null;
  try {
    token = await getToken();
  } catch {
    return { status: 'unauthorized' };
  }
  if (!token) return { status: 'unauthorized' };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${PATH}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Found-Surface': 'tablet',
        Accept: 'application/json',
      },
    });
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : 'Network error' };
  }

  if (response.status === 401) return { status: 'unauthorized' };
  if (response.status === 403) return { status: 'wrong-project' };

  let json: MyProjectsResponse;
  try {
    json = (await response.json()) as MyProjectsResponse;
  } catch {
    return { status: 'error', message: `Non-JSON response (HTTP ${response.status})` };
  }

  if (!response.ok || json.error) {
    return { status: 'error', message: json.error?.message ?? `HTTP ${response.status}` };
  }

  const projects = json.data?.projects ?? [];
  if (projects.length === 0) return { status: 'no-access' };

  return { status: 'ok', projects };
}

/**
 * Hook wrapper — loads memberships into the tenant store and exposes the outcome.
 */
export function useMyProjects() {
  const { getToken } = useAuth();
  const setKnownProjects = useTenantStore((s) => s.setKnownProjects);

  const [outcome, setOutcome] = useState<MyProjectsOutcome | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (baseUrl?: string): Promise<MyProjectsOutcome> => {
      setIsLoading(true);
      const result = await fetchMyProjects(getToken, baseUrl ?? resolveBaseUrl());
      if (result.status === 'ok') {
        setKnownProjects(result.projects);
      }
      setOutcome(result);
      setIsLoading(false);
      return result;
    },
    [getToken, setKnownProjects]
  );

  return { load, outcome, isLoading };
}

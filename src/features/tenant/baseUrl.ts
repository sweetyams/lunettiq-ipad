import { useTenantStore } from './useTenantStore';

/**
 * Single source of truth for resolving the active Foundry API host.
 *
 * Priority:
 *  1. The active project's authoritative baseUrl (from /api/platform/my-projects).
 *  2. EXPO_PUBLIC_FOUNDRY_BASE_URL — the build-time default (single-project fallback).
 *  3. A hardcoded dev/prod default, matching the app's original behaviour.
 *
 * Keeping this in one place means the API client and the design-token provider always
 * agree on which host to hit.
 */

/** Build-time / dev fallback used before any project is active. */
export const DEFAULT_BASE_URL: string =
  process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL
  ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com');

/** Resolve the base URL for the current request/fetch, at call time. */
export function resolveBaseUrl(): string {
  return useTenantStore.getState().activeProject?.baseUrl ?? DEFAULT_BASE_URL;
}

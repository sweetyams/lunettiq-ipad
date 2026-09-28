import { create } from 'zustand';
import { api, APIError } from '@/src/api/client';
import { useTenantStore } from './useTenantStore';

/**
 * Per-tenant capability probe.
 *
 * `my-projects` does NOT tell the app which modules a project has enabled (see
 * docs/multi-project — flagged to Foundry). So the iPad can only learn a tenant's
 * capabilities by probing an endpoint and seeing whether the module responds.
 *
 * This matters because a user may belong to a project that is NOT set up for the iPad
 * app (no device-management module, no storefront data). Landing there must degrade
 * gracefully instead of trapping the user behind a dead PIN screen.
 *
 * We probe `GET /api/admin/device/staff-roster` once per active tenant:
 *  - success           → device-management enabled  → PIN lock is meaningful
 *  - NOT_FOUND / 404   → module not enabled          → solo mode (no PIN lock)
 *  - other error       → unknown (leave null; don't force solo on a transient failure)
 */

type Capability = boolean | null; // null = not yet probed / unknown

interface TenantCapabilitiesState {
  /** Keyed by tenant slug. */
  deviceManagement: Record<string, Capability>;
  probe: (slug: string) => Promise<void>;
  get: (slug: string) => Capability;
  reset: () => void;
}

function isModuleDisabledError(err: unknown): boolean {
  if (err instanceof APIError) {
    if (err.status === 404) return true;
    if (err.code === 'NOT_FOUND') return true;
    const msg = err.message?.toLowerCase() ?? '';
    if (msg.includes('module') && msg.includes('enabled')) return true; // "module not enabled"
    if (msg.includes('not enabled')) return true;
  }
  return false;
}

export const useTenantCapabilities = create<TenantCapabilitiesState>((set, get) => ({
  deviceManagement: {},

  probe: async (slug: string) => {
    // Skip if already known for this tenant.
    if (get().deviceManagement[slug] !== undefined && get().deviceManagement[slug] !== null) {
      return;
    }
    try {
      // A cheap call that only succeeds when device-management is enabled.
      await api.get('/api/admin/device/staff-roster');
      set((s) => ({ deviceManagement: { ...s.deviceManagement, [slug]: true } }));
    } catch (err) {
      if (isModuleDisabledError(err)) {
        set((s) => ({ deviceManagement: { ...s.deviceManagement, [slug]: false } }));
      }
      // Transient/unknown errors: leave unset so we retry next time (and don't
      // wrongly drop PIN protection on a network blip).
    }
  },

  get: (slug: string) => get().deviceManagement[slug] ?? null,

  reset: () => set({ deviceManagement: {} }),
}));

/** Convenience: capability of the currently active tenant. */
export function useActiveTenantDeviceManagement(): Capability {
  const slug = useTenantStore((s) => s.activeProject?.slug ?? null);
  const map = useTenantCapabilities((s) => s.deviceManagement);
  return slug ? map[slug] ?? null : null;
}

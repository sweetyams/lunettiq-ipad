import { create } from 'zustand';
import { api, APIError } from '@/src/api/client';
import { useTenantStore } from './useTenantStore';

/**
 * Per-tenant device quick-switch (PIN) capability probe.
 *
 * This tells the app ONLY whether the active store has the device quick-switch / PIN
 * roster feature enabled — it decides whether to show the PIN lock screen. It does NOT
 * decide whether the store is "iPad-ready" overall; that is the authoritative `ipadReady`
 * field from `my-projects` (see TenantCapabilityNotice).
 *
 * We probe `GET /api/admin/device/staff-roster` once per active tenant:
 *  - success                    → quick-switch enabled  → PIN lock is meaningful
 *  - NOT_FOUND / 404 / disabled → quick-switch off       → skip the PIN lock (no lock)
 *  - other error                → unknown (leave null; don't drop the lock on a blip)
 *
 * A store can be fully `ipadReady` and still have quick-switch off — that's fine; it just
 * means no PIN lock, not that the store is unusable.
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

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { useTenantStore } from './useTenantStore';

/**
 * Device-bound location.
 *
 * The physical branch a device sits at is a property of the DEVICE, not the logged-in
 * user (iPad A = Montreal, iPad B = Toronto). Any staff can log into either device; the
 * device stays pinned to its branch until a manager changes it.
 *
 * Stored per tenant slug — location ids belong to one store, and switching stores must
 * not carry a location across. Persisted so the binding survives relaunch and user
 * changes.
 *
 * See docs/multi-project/06-device-location-scope.md.
 */

interface DeviceLocationState {
  /** Pinned location id, keyed by tenant slug. */
  bySlug: Record<string, string>;
}

interface DeviceLocationActions {
  setLocation: (slug: string, locationId: string) => void;
  clearLocation: (slug: string) => void;
  getLocation: (slug: string) => string | null;
}

const storage = new MMKV({ id: 'device-location' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export const useDeviceLocationStore = create<DeviceLocationState & DeviceLocationActions>()(
  persist(
    (set, get) => ({
      bySlug: {},

      setLocation: (slug, locationId) =>
        set((s) => ({ bySlug: { ...s.bySlug, [slug]: locationId } })),

      clearLocation: (slug) =>
        set((s) => {
          const next = { ...s.bySlug };
          delete next[slug];
          return { bySlug: next };
        }),

      getLocation: (slug) => get().bySlug[slug] ?? null,
    }),
    {
      name: 'device-location-state',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * The device's pinned location for the ACTIVE store, or null if none set.
 * Reactive hook.
 */
export function useDeviceLocationId(): string | null {
  const slug = useTenantStore((s) => s.activeProject?.slug ?? null);
  const bySlug = useDeviceLocationStore((s) => s.bySlug);
  return slug ? bySlug[slug] ?? null : null;
}

/**
 * Effective location id for the active store, in precedence order:
 *   1. device-pinned location (this iPad's branch) — always wins
 *   2. user's primaryLocationId (from my-projects) — pre-config fallback
 *   3. user's first assigned location
 *   4. null → caller should prompt to set a device location
 *
 * Reactive hook — use in components.
 */
export function useEffectiveLocationId(): string | null {
  const activeProject = useTenantStore((s) => s.activeProject);
  const deviceLocation = useDeviceLocationId();
  return (
    deviceLocation ??
    activeProject?.primaryLocationId ??
    activeProject?.locationIds?.[0] ??
    null
  );
}

/**
 * Non-reactive resolver for use outside React (e.g. the API client's request()).
 */
export function resolveEffectiveLocationId(): string | null {
  const activeProject = useTenantStore.getState().activeProject;
  const slug = activeProject?.slug ?? null;
  const deviceLocation = slug ? useDeviceLocationStore.getState().bySlug[slug] ?? null : null;
  return (
    deviceLocation ??
    activeProject?.primaryLocationId ??
    activeProject?.locationIds?.[0] ??
    null
  );
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

/**
 * Tenant (project) selection store.
 *
 * The iPad is a login-onward, mobile-JWT caller. Identity comes from Clerk; the
 * *project* (tenant) is chosen by which host the app talks to. This store holds the
 * active project's authoritative host + role/location data, sourced from Foundry's
 * `GET /api/platform/my-projects`.
 *
 * See docs/multi-project/01-ipad-plan.md.
 *
 * Mirrors the MMKV-backed pattern of useOperatorStore.
 */

// --- Types ---

export type ProjectEnv = 'production' | 'demo' | 'staging';

export interface Project {
  /** Project slug, e.g. "lunettiq" or "lunettiq-demo". Also the per-project DB name key. */
  slug: string;
  /** Human-readable name for the picker, e.g. "Lunettiq (Demo)". */
  name: string;
  /** Authoritative API host for this project. The app never constructs this itself. */
  baseUrl: string;
  /** This user's role in this project. */
  role: string;
  /** All locations this user is assigned to in this project. */
  locationIds: string[];
  /** Preferred location for this user in this project. */
  primaryLocationId: string | null;
  /** Deployment kind — drives the demo indicator strip. */
  env: ProjectEnv;
  /** Whether this store is set up for the iPad app (authoritative, from my-projects). */
  ipadReady?: boolean;
  /** Optional brand mark for the picker. */
  brandMark?: string;
}

export interface TenantState {
  /** The project the app is currently operating against. */
  activeProject: Project | null;
  /** All projects the logged-in user belongs to (from /api/platform/my-projects). */
  knownProjects: Project[];
  /** When knownProjects was last fetched (ms epoch). */
  fetchedAt: number | null;
}

interface TenantActions {
  setActiveProject: (project: Project) => void;
  setKnownProjects: (projects: Project[]) => void;
  clearActiveProject: () => void;
  /** Convenience selector — the active project's base URL, or null when none is active. */
  getActiveBaseUrl: () => string | null;
  /** Convenience selector — the active project's slug, or null when none is active. */
  getActiveSlug: () => string | null;
}

// --- MMKV Storage ---

const storage = new MMKV({ id: 'tenant-store' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// --- Store ---

const INITIAL_STATE: TenantState = {
  activeProject: null,
  knownProjects: [],
  fetchedAt: null,
};

export const useTenantStore = create<TenantState & TenantActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setActiveProject: (project: Project) => {
        set({ activeProject: project });
      },

      setKnownProjects: (projects: Project[]) => {
        set({ knownProjects: projects, fetchedAt: Date.now() });
      },

      clearActiveProject: () => {
        set({ activeProject: null });
      },

      getActiveBaseUrl: (): string | null => {
        return get().activeProject?.baseUrl ?? null;
      },

      getActiveSlug: (): string | null => {
        return get().activeProject?.slug ?? null;
      },
    }),
    {
      name: 'tenant-state',
      storage: createJSONStorage(() => mmkvStorage),
      // Persist active + known projects so an offline relaunch restores the last project.
      partialize: (state) => ({
        activeProject: state.activeProject,
        knownProjects: state.knownProjects,
        fetchedAt: state.fetchedAt,
      }),
    }
  )
);

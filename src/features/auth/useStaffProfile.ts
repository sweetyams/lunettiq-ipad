import { useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';

/**
 * Shape of the staff project metadata stored in Clerk publicMetadata.
 * Set by Foundry when a staff member is invited/updated.
 */
interface StaffProjectMetadata {
  role: string;
  location_ids: string[];
  primary_location_id?: string;
}

interface StaffPublicMetadata {
  projects?: Record<string, StaffProjectMetadata>;
}

interface StaffProfile {
  /** Clerk user ID — used as staffId for API calls */
  staffId: string;
  /** Primary location for this staff member */
  locationId: string | null;
  /** All assigned locations */
  locationIds: string[];
  /** Staff role */
  role: string | null;
  /** Whether we have valid profile data */
  isReady: boolean;
}

/**
 * Reads the current staff member's profile for the active project.
 *
 * Source of truth (in priority order):
 *  1. The active project from `useTenantStore` (populated by /api/platform/my-projects) —
 *     carries role + locations already resolved server-side.
 *  2. Clerk `publicMetadata.projects[<active slug>]` — offline/fallback when the endpoint
 *     data isn't available. Foundry writes `projects.{slug}` at invite time with role,
 *     location_ids, primary_location_id.
 *  3. Final fallback: userId as staffId, no location (session creation fails gracefully).
 */
export function useStaffProfile(): StaffProfile {
  const { user } = useUser();
  const { userId } = useAuth();
  const activeProject = useTenantStore((s) => s.activeProject);

  return useMemo(() => {
    if (!user || !userId) {
      return { staffId: '', locationId: null, locationIds: [], role: null, isReady: false };
    }

    // 1. Prefer the active project — role/locations already resolved by Foundry.
    if (activeProject) {
      return {
        staffId: userId,
        locationId: activeProject.primaryLocationId ?? activeProject.locationIds[0] ?? null,
        locationIds: activeProject.locationIds ?? [],
        role: activeProject.role ?? null,
        isReady: true,
      };
    }

    // 2. Fall back to Clerk metadata for the active slug (dynamic key, not hardcoded).
    const meta = user.publicMetadata as StaffPublicMetadata | undefined;
    const slug = useTenantStore.getState().activeProject?.slug;
    const projectMeta = slug ? meta?.projects?.[slug] : undefined;

    if (!projectMeta) {
      // 3. Dev / not-yet-selected: use userId as staffId, no location.
      return { staffId: userId, locationId: null, locationIds: [], role: null, isReady: true };
    }

    return {
      staffId: userId,
      locationId: projectMeta.primary_location_id ?? projectMeta.location_ids[0] ?? null,
      locationIds: projectMeta.location_ids ?? [],
      role: projectMeta.role ?? null,
      isReady: true,
    };
  }, [user, userId, activeProject]);
}

import { useMemo } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';

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
 * Reads the current staff member's profile from Clerk publicMetadata.
 * 
 * Foundry stores `projects.{slug}` in Clerk's publicMetadata at invite time with:
 *   - role
 *   - location_ids
 *   - primary_location_id
 * 
 * This hook extracts that data for the 'lunettiq' project slug.
 */
export function useStaffProfile(): StaffProfile {
  const { user } = useUser();
  const { userId } = useAuth();

  return useMemo(() => {
    if (!user || !userId) {
      return { staffId: '', locationId: null, locationIds: [], role: null, isReady: false };
    }

    const meta = user.publicMetadata as StaffPublicMetadata | undefined;
    const projectMeta = meta?.projects?.lunettiq;

    if (!projectMeta) {
      // Fallback: in dev mode or if metadata isn't set yet, use userId as staffId
      // and locationId will be null (session creation will fail gracefully)
      return { staffId: userId, locationId: null, locationIds: [], role: null, isReady: true };
    }

    return {
      staffId: userId,
      locationId: projectMeta.primary_location_id ?? projectMeta.location_ids[0] ?? null,
      locationIds: projectMeta.location_ids ?? [],
      role: projectMeta.role ?? null,
      isReady: true,
    };
  }, [user, userId]);
}

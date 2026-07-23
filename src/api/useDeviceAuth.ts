import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './client';

// --- Types ---

export interface StaffRosterEntry {
  staffId: string;
  clerkUserId: string;
  name: string;
  role: string;
  imageUrl: string | null;
  hasPinSet: boolean;
}

export interface VerifyPinResponse {
  staffId: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: string;
}

export interface VerifyPinError {
  code: 'INVALID_PIN' | 'LOCKED';
  message: string;
  details: { remainingAttempts?: number; lockedUntil?: string };
}

// --- Query Hooks ---

/**
 * Get staff roster for device quick-switching
 * GET /api/admin/device/staff-roster?locationId={locationId}
 * locationId is optional — if omitted, returns all active staff for the project.
 */
export function useStaffRoster(locationId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['device', 'staff-roster', locationId],
    queryFn: async (): Promise<StaffRosterEntry[]> => {
      return api.get('/api/admin/device/staff-roster', locationId
        ? { params: { locationId } }
        : undefined
      );
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: false, // Don't retry — if module is disabled, it won't magically enable
  });
}

// --- Mutation Hooks ---

/**
 * Verify PIN for staff quick-switch
 * POST /api/admin/device/verify-pin
 */
export function useVerifyPin() {
  return useMutation({
    mutationFn: async (params: {
      staffId: string;
      pin: string;
    }): Promise<VerifyPinResponse> => {
      return api.post('/api/admin/device/verify-pin', params);
    },
  });
}

/**
 * Set PIN for staff member
 * POST /api/admin/device/set-pin
 */
export function useSetPin() {
  return useMutation({
    mutationFn: async (params: {
      staffId: string;
      pin: string;
    }): Promise<{ success: true }> => {
      return api.post('/api/admin/device/set-pin', params);
    },
  });
}
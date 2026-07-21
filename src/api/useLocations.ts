import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string | null;
  email: string | null;
  hours: {
    monday: { open: string; close: string } | null;
    tuesday: { open: string; close: string } | null;
    wednesday: { open: string; close: string } | null;
    thursday: { open: string; close: string } | null;
    friday: { open: string; close: string } | null;
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  timezone: string;
  isActive: boolean;
}

/**
 * Fetch all active locations from GET /api/storefront/locations (public endpoint)
 */
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const result = await api.get<Location[]>('/api/storefront/locations');
      return result;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h - locations don't change often
  });
}
import { useQuery } from '@tanstack/react-query';
import { api } from './client';

/** Localized label, e.g. { en: "Old Montreal", fr: "Vieux-Montréal" }. */
export interface LocalizedLabel {
  en?: string;
  fr?: string;
  [lang: string]: string | undefined;
}

export interface LocationClosure {
  label: string;
  closedFrom: string;
  closedTo: string;
}

/**
 * A store branch, as returned by GET /api/storefront/locations.
 * Shape confirmed in docs/multi-project/08-foundry-ready-handoff.md §2.
 * Only active locations are returned (there is no `isActive` field).
 */
export interface Location {
  id: string;
  /** Localized display name — use publicLabel, NOT a flat `name`. */
  publicLabel: LocalizedLabel;
  locationType: string; // "retail" | "warehouse" | ...
  address: string | null;
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  isRetail: boolean;
  fulfillsOnline: boolean;
  lat: number | null;
  lng: number | null;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  description: string | null;
  closures: LocationClosure[];
}

/** Resolve a Location's display name from its localized label, preferring EN. */
export function locationName(loc: Location): string {
  return loc.publicLabel?.en ?? loc.publicLabel?.fr ?? Object.values(loc.publicLabel ?? {})[0] ?? 'Location';
}

/**
 * Fetch all active branches of the active store.
 * GET /api/storefront/locations — returns every active location for the tenant
 * resolved by host (unfiltered by user). `id` is the value sent back as
 * `X-Found-Location` / `locationId`.
 */
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      return api.get<Location[]>('/api/storefront/locations');
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h — locations rarely change
  });
}

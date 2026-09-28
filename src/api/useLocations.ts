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
 * Shape per docs/multi-project/08-foundry-ready-handoff.md §2, but tolerant of variants
 * (publicLabel may be an object, a plain string, or absent; a flat `name` may exist).
 */
export interface Location {
  id: string;
  /** Localized display name — object {en,fr}, or possibly a plain string. */
  publicLabel?: LocalizedLabel | string;
  /** Some responses use a flat name. */
  name?: string;
  label?: string;
  locationType?: string; // "retail" | "warehouse" | ...
  address: string | null;
  operatingHours?: Record<string, { open: string; close: string } | null> | null;
  isRetail?: boolean;
  fulfillsOnline?: boolean;
  lat?: number | null;
  lng?: number | null;
  email?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  closures?: LocationClosure[];
}

/**
 * Resolve a Location's display name, tolerant of shape:
 * publicLabel {en,fr} → publicLabel string → flat name/label → address → short id.
 */
export function locationName(loc: Location): string {
  const pl = loc.publicLabel;
  if (typeof pl === 'string' && pl.trim()) return pl;
  if (pl && typeof pl === 'object') {
    const localized = pl.en ?? pl.fr ?? Object.values(pl).find((v) => typeof v === 'string' && v.trim());
    if (localized) return localized;
  }
  if (loc.name?.trim()) return loc.name;
  if (loc.label?.trim()) return loc.label;
  if (loc.address?.trim()) return loc.address;
  return `Location ${loc.id.slice(0, 6)}`;
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
      const result = await api.get<Location[]>('/api/storefront/locations');
      if (__DEV__ && result?.[0]) {
        console.log('[locations] first row keys:', Object.keys(result[0]));
        console.log('[locations] first row:', JSON.stringify(result[0]));
      }
      return result;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h — locations rarely change
  });
}

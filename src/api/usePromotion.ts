import { useQuery } from '@tanstack/react-query';
import { api } from './client';

/** The store's running promotion, as lunettiq.com shows it (GET /api/storefront/promotion). */
export interface StorefrontPromotion {
  id: string;
  title: { en: string; fr?: string };
  kind: string;
  tiers?: { percent: number; minQuantity: number }[];
  messages?: { badge?: { en?: string; fr?: string }; banner?: { en?: string; fr?: string } };
  window?: { startsAt?: string | null; endsAt?: string | null };
  /** Shopify product ids it applies to. */
  productIds?: string[];
}

export function usePromotion() {
  return useQuery({
    queryKey: ['storefront', 'promotion'],
    queryFn: async () => (await api.get<StorefrontPromotion | null>('/api/storefront/promotion')) ?? null,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * True when the promotion is live now and covers this product (no product list → every product).
 * Without a product (the Frames banner) it only checks that the promotion is live.
 */
export function promotionApplies(promo: StorefrontPromotion | null | undefined, shopifyId: string | undefined, now = Date.now()): boolean {
  if (!promo) return false;
  const starts = promo.window?.startsAt ? Date.parse(promo.window.startsAt) : -Infinity;
  const ends = promo.window?.endsAt ? Date.parse(promo.window.endsAt) : Infinity;
  if (now < starts || now >= ends) return false;
  return shopifyId === undefined || !promo.productIds?.length || promo.productIds.includes(shopifyId);
}

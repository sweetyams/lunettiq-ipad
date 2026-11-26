import { resolveBaseUrl } from '@/src/features/tenant/baseUrl';

/** The widths Foundry's image resizer (Next.js /_next/image) serves. */
const WIDTHS = [64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920] as const;

/** The smallest served width at least `px` wide (the largest if none is). */
export function servedWidth(px: number): number {
  return WIDTHS.find((w) => w >= px) ?? 1920;
}

/**
 * A product photo at the size it's shown. Shopify-hosted photos go through
 * Foundry's image resizer, as lunettiq.com serves them: resized, re-encoded and
 * cached on Foundry's CDN. Fetched straight from cdn.shopify.com they hung on
 * some networks (only the first photo ever loaded). Foundry-hosted and local
 * photos are returned unchanged. Pure apart from reading the store's address; tested.
 */
export function sizedImage(url: string | null | undefined, width: number, base: string = resolveBaseUrl()): string {
  if (!url) return '';
  if (!/^https:\/\/cdn\.shopify\.com\//.test(url)) return url;
  // Shopify's own width param would only fight the resizer's.
  const [path, query = ''] = url.split('?');
  const keep = query.split('&').filter((p) => p && !/^width=/.test(p)).join('&');
  const source = keep ? `${path}?${keep}` : path!;
  return `${base.replace(/\/$/, '')}/_next/image?url=${encodeURIComponent(source)}&w=${servedWidth(width)}&q=75`;
}

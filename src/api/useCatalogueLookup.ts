import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { productKey, type Product, type ProductVariant } from './products.types';

const titleOf = (p: Pick<Product, 'title'>) => (typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '');

export interface CatalogueHit { title: string; price: string | null; image: string | null }

/**
 * Names a frame from its product or variant id, using the catalogue the iPad already
 * holds (the same request Frames makes). Foundry's wishlist and product-interaction rows
 * carry only ids, so the wishlist read "Frame" with no price and follow-ups never named
 * the frames a client liked.
 */
export function useCatalogueLookup() {
  const { data } = useProducts({ limit: 300, offset: 0 });
  return useMemo(() => {
    const byId = new Map<string, CatalogueHit>();
    for (const p of data?.data ?? []) {
      const hit: CatalogueHit = { title: titleOf(p), price: p.priceMin ?? null, image: p.images?.[0]?.url ?? null };
      for (const id of [productKey(p), p.id, p.shopifyId, p.handle]) if (id) byId.set(String(id), hit);
      for (const v of ((p as Product & { variants?: ProductVariant[] }).variants ?? [])) {
        byId.set(String(v.shopifyId), { ...hit, price: v.price ?? hit.price });
      }
    }
    /** Accepts plain ids and Shopify gids ("gid://shopify/ProductVariant/123"). */
    return (id: string | null | undefined): CatalogueHit | null => {
      if (!id) return null;
      return byId.get(String(id)) ?? byId.get(String(id).split('/').pop() ?? '') ?? null;
    };
  }, [data]);
}

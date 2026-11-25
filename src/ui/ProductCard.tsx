import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Badge } from '@/src/ui/kit/Badge';
import { elevation } from '@/src/ui/kit/elevation';
import type { Product } from '@/src/api/products.types';
export { gridColumns } from './productGrid';

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
  /** Suggestion score from Foundry (≥5 good fit, ≥3 close). */
  fitScore?: number | null;
  fitReasons?: string[];
  stockStatus?: 'in' | 'low' | 'out';
  /** Card name instead of the product title (a family name). */
  name?: string;
  /** Line under the name instead of colours / vendor ("3 colours · Optical & sun"). */
  subtitle?: string;
  /** Price instead of the product's lowest ("from" price for a family). */
  priceFrom?: string | null;
}

export const productTitle = (p: Pick<Product, 'title'>) =>
  typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '';

export function formatPrice(v: string | number | null | undefined): string | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return `$${n.toLocaleString('en-CA', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/**
 * ProductCard — square, full-bleed photo (as in the Foundry admin), then name,
 * colours and (staff only) price. Stock and fit are small badges, never
 * coloured slabs.
 */
export function ProductCard({ product, onPress, onLongPress, fitScore = null, fitReasons, stockStatus, name, subtitle, priceFrom }: ProductCardProps) {
  const staff = usePrivacyStore((s) => s.mode) === 'staff';
  const image = product.images[0];
  const title = name ?? productTitle(product);
  const stock = stockStatus ?? product.viewHints?.stockBucket;
  const colourOption = product.options?.find((o) => /^colou?r$/i.test(o.name));
  const colours = colourOption?.values?.length ?? (product.variantCount > 1 ? product.variantCount : 0);
  const price = staff ? formatPrice(priceFrom !== undefined ? priceFrom : product.priceMin) : null;
  const id = product.shopifyId ?? product.id ?? '';
  const fit = fitScore != null && fitScore >= 5 ? 'Good fit' : fitScore != null && fitScore >= 3 ? 'Close fit' : null;

  return (
    <Pressable
      onPress={() => onPress(id)}
      onLongPress={onLongPress ? () => onLongPress(id) : undefined}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle ?? (colours > 1 ? `${colours} colours` : null), price, stock === 'out' ? 'out of stock' : stock === 'low' ? 'low stock' : null, fit].filter(Boolean).join(', ')}
      accessibilityHint={fitReasons?.length ? fitReasons.join(', ') : undefined}
    >
      {({ pressed }) => (
        <View className={`bg-bg-page border rounded-lg overflow-hidden ${pressed ? 'border-text-tertiary' : 'border-border'}`} style={elevation.raised}>
          {/* Square, full-bleed photo (Foundry admin cards): the studio shots already sit on a light background. */}
          <View className="items-center justify-center bg-bg-subtle" style={{ aspectRatio: 1 }}>
            {image ? (
              <Image source={{ uri: image.url }} contentFit="cover" transition={150} style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
            ) : (
              <Text className="text-body-sm text-text-dim">No photo</Text>
            )}
            {stock === 'out' || stock === 'low' || fit ? (
              <View className="absolute top-[8px] right-[8px] items-end gap-[4px]" pointerEvents="none">
                {stock === 'out' ? <Badge tone="danger">Out of stock</Badge> : stock === 'low' ? <Badge tone="warning">Low stock</Badge> : null}
                {fit ? <Badge tone="success" dot>{fit}</Badge> : null}
              </View>
            ) : null}
          </View>
          <View className="px-[14px] py-[12px] border-t border-border gap-[2px]">
            <Text className="text-body-md font-medium text-text-primary" numberOfLines={1}>{title}</Text>
            <View className="flex-row items-center justify-between gap-[8px]">
              <Text className="text-body-sm text-text-tertiary" numberOfLines={1}>{subtitle ?? (colours > 1 ? `${colours} colours` : product.vendor ?? '')}</Text>
              {price ? <Text className="text-body-sm font-medium text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{price}</Text> : null}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { FitBadge } from './FitBadge';
import { StockDot } from './StockDot';
import type { Product } from '@/src/api/products.types';

interface ProductCardProps {
  product: Product;
  onPress: (id: string) => void;
  fitScore?: number | null;
  fitReasons?: string[];
  stockStatus?: 'in' | 'low' | 'out';
  isOwned?: boolean;
}

export function ProductCard({
  product,
  onPress,
  fitScore = null,
  fitReasons,
  stockStatus,
  isOwned = false,
}: ProductCardProps) {
  const mode = usePrivacyStore((s) => s.mode);
  const image = product.images[0];
  const title = typeof product.title === 'string'
    ? product.title
    : product.title?.en ?? product.title?.fr ?? '';

  const resolvedStockStatus = stockStatus ?? product.viewHints?.stockBucket;

  return (
    <Pressable
      onPress={() => onPress(product.shopifyId ?? product.id)}
      accessibilityRole="button"
      accessibilityLabel={`${title}${product.vendor ? `, ${product.vendor}` : ''}${mode === 'staff' && product.priceMin ? `, $${product.priceMin}` : ''}${isOwned ? ', owned' : ''}`}
      className={`bg-bg-elevated rounded-lg border border-border overflow-hidden ${isOwned ? 'opacity-70' : ''}`}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.96 : 1 }] })}
    >
      {/* Image container */}
      <View className="aspect-square bg-bg-surface items-center justify-center relative">
        {image ? (
          <Image
            source={{ uri: image.url }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={image.alt ?? title}
          />
        ) : (
          <View className="w-full h-full bg-bg-surface items-center justify-center">
            <Text className="text-text-muted text-caption">No image</Text>
          </View>
        )}

        {/* StockDot — top-right corner */}
        {resolvedStockStatus && (
          <View className="absolute top-2 right-2">
            <StockDot status={resolvedStockStatus} />
          </View>
        )}

        {/* Owned badge — top-left corner */}
        {isOwned && (
          <View className="absolute top-2 left-2 bg-brand/80 rounded-full px-sm py-xs">
            <Text className="text-brand-text text-caption font-medium">Owned</Text>
          </View>
        )}
      </View>

      {/* Meta */}
      <View className="p-sm">
        <Text className="text-text-primary text-body font-medium" numberOfLines={1}>
          {title}
        </Text>
        {product.vendor && (
          <Text className="text-text-muted text-caption mt-xs" numberOfLines={1}>
            {product.vendor}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-sm">
          {/* Price — hidden in client mode */}
          {mode === 'staff' && product.priceMin && (
            <Text className="text-text-primary text-body font-medium">
              ${product.priceMin}
            </Text>
          )}
          {mode === 'client' && (
            <Text className="text-text-muted text-caption border border-border rounded-full px-sm py-xs">
              Tap for price
            </Text>
          )}
          {/* Colour count — use options if available, fall back to variantCount */}
          {(() => {
            const colourOption = product.options?.find(
              (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
            );
            const colourCount = colourOption?.values?.length ?? (product.variantCount > 1 ? product.variantCount : 0);
            return colourCount > 1 ? (
              <Text className="text-text-muted text-caption">
                {colourCount} colours
              </Text>
            ) : null;
          })()}
        </View>

        {/* FitBadge */}
        {fitScore !== null && (
          <View className="mt-xs">
            <FitBadge score={fitScore} reasons={fitReasons} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

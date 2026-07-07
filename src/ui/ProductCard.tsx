import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import type { Product } from '@/src/api/products.types';

interface ProductCardProps {
  product: Product;
  onPress: (shopifyId: string) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const mode = usePrivacyStore((s) => s.mode);
  const image = product.images[0];

  return (
    <Pressable
      onPress={() => onPress(product.shopifyId)}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${product.vendor ?? ''}`}
      className="bg-white rounded-lg border border-warmGrey overflow-hidden"
    >
      {/* Image */}
      <View className="aspect-square bg-offWhite items-center justify-center">
        {image ? (
          <Image
            source={{ uri: image.url }}
            contentFit="cover"
            className="w-full h-full"
            accessibilityLabel={image.alt ?? product.title}
          />
        ) : (
          <View className="w-full h-full bg-warmGrey items-center justify-center">
            <Text className="text-midGrey text-caption">No image</Text>
          </View>
        )}
      </View>

      {/* Meta */}
      <View className="p-sm">
        <Text className="text-charcoal text-body font-medium" numberOfLines={1}>
          {product.title}
        </Text>
        {product.vendor && (
          <Text className="text-midGrey text-caption mt-xs" numberOfLines={1}>
            {product.vendor}
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-sm">
          {/* Price — hidden in client mode */}
          {mode === 'staff' && product.priceMin && (
            <Text className="text-charcoal text-body font-medium">
              ${product.priceMin}
            </Text>
          )}
          {mode === 'client' && (
            <Text className="text-midGrey text-caption border border-warmGrey rounded-full px-sm py-xs">
              Tap for price
            </Text>
          )}
          {/* Variant count */}
          {product.variantCount > 1 && (
            <Text className="text-midGrey text-caption">
              {product.variantCount} colours
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

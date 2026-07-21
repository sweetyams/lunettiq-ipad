import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useProductFamily } from '@/src/api/useProductFamily';
import type { ProductSibling } from '@/src/api/families.types';

interface ColourSiblingsProps {
  productId: string;
  currentHandle?: string;
}

/**
 * Colour switcher for product detail (PRD-02).
 * Fetches siblings from the product family and renders coloured chips.
 * Tapping a chip navigates to that sibling product.
 */
export function ColourSiblings({ productId, currentHandle }: ColourSiblingsProps) {
  const router = useRouter();
  const { data: family, isLoading } = useProductFamily(productId);

  if (isLoading || !family || !family.siblings || family.siblings.length <= 1) {
    return null; // No siblings or still loading — don't render
  }

  const handleSiblingPress = (sibling: ProductSibling) => {
    if (sibling.handle === currentHandle) return; // Already viewing this one
    router.push(`/products/${sibling.shopifyId}`);
  };

  return (
    <View className="p-lg bg-bg-elevated border-b border-border">
      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-bodyStrong text-text-primary">
          {family.familyName?.toUpperCase() ?? 'Family'} · {family.siblings.length} colours
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {family.siblings.map((sibling) => {
          const isCurrent = sibling.handle === currentHandle || sibling.shopifyId === productId;
          return (
            <Pressable
              key={sibling.shopifyId}
              onPress={() => handleSiblingPress(sibling)}
              accessibilityRole="button"
              accessibilityLabel={`${sibling.colour ?? sibling.title}${isCurrent ? ', current' : ''}`}
              accessibilityState={{ selected: isCurrent }}
              className={`min-h-[44px] min-w-[44px] px-md py-sm rounded-full flex-row items-center justify-center border mr-sm ${
                isCurrent
                  ? 'bg-brand border-brand'
                  : 'bg-bg-elevated border-border'
              }`}
            >
              {/* Colour swatch */}
              {sibling.colourHex && (
                <View
                  className={`w-5 h-5 rounded-full mr-xs border ${isCurrent ? 'border-white/50' : 'border-border'}`}
                  style={{ backgroundColor: sibling.colourHex }}
                />
              )}
              <Text
                className={`text-caption font-medium ${
                  isCurrent ? 'text-brand-text' : 'text-text-primary'
                }`}
                numberOfLines={1}
              >
                {sibling.colour ?? sibling.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

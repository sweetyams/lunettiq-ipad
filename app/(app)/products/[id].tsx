import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useProduct } from '@/src/api/useProducts';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { LoadingState, ErrorState, EmptyState, Button } from '@/src/ui';

interface VariantChipProps {
  variant: {
    shopifyId: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    imageUrl: string | null;
    price: string;
    availableForSale: boolean;
  };
  isSelected: boolean;
  onPress: () => void;
}

function VariantChip({ variant, isSelected, onPress }: VariantChipProps) {
  const colorOption = variant.selectedOptions.find(option => 
    option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour'
  );
  
  if (!colorOption) return null;

  return (
    <Pressable
      onPress={onPress}
      className={`px-md py-sm rounded-full min-h-[44px] min-w-[44px] mr-sm items-center justify-center border ${
        isSelected 
          ? 'bg-navy border-navy' 
          : 'bg-white border-warmGrey'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Select ${colorOption.value} color variant`}
    >
      <Text className={`text-caption font-medium ${
        isSelected ? 'text-white' : 'text-charcoal'
      }`}>
        {colorOption.value}
      </Text>
    </Pressable>
  );
}

interface StockBadgeProps {
  inventoryQuantity?: number;
  availableForSale: boolean;
}

function StockBadge({ inventoryQuantity, availableForSale }: StockBadgeProps) {
  if (!availableForSale) {
    return (
      <View className="bg-error px-sm py-xs rounded-sm">
        <Text className="text-white text-captionStrong">Out of stock</Text>
      </View>
    );
  }

  if (inventoryQuantity !== undefined) {
    if (inventoryQuantity <= 3 && inventoryQuantity > 0) {
      return (
        <View className="bg-warning px-sm py-xs rounded-sm">
          <Text className="text-white text-captionStrong">Low stock</Text>
        </View>
      );
    }
    
    if (inventoryQuantity > 3) {
      return (
        <View className="bg-green px-sm py-xs rounded-sm">
          <Text className="text-white text-captionStrong">In stock</Text>
        </View>
      );
    }
  }

  return null;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading, error, refetch } = useProduct(id || '');
  const privacyMode = usePrivacyStore(state => state.mode);
  const { activeClientId, mode: sessionMode } = useSessionStore();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState(false);

  const handleStartSession = () => {
    // TODO: Implement start session logic
    console.log('Start session');
  };

  const handleAddToSession = () => {
    // TODO: Implement add to session logic
    console.log('Add to session');
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!product) return <EmptyState message="Product not found" />;

  const selectedVariant = selectedVariantId 
    ? product.variants?.find(v => v.shopifyId === selectedVariantId)
    : product.variants?.[0];

  const colorVariants = product.variants?.filter(variant =>
    variant.selectedOptions.some(option => 
      option.name.toLowerCase() === 'color' || option.name.toLowerCase() === 'colour'
    )
  ) || [];

  const hasActiveSession = activeClientId && sessionMode !== 'discovery';

  return (
    <View className="flex-1 bg-offWhite">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image Carousel */}
        <View className="h-96 bg-white">
          {product.images.length > 0 ? (
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              {product.images.map((image, index) => (
                <View key={index} className="w-screen h-96">
                  <Image
                    source={{ uri: image.url }}
                    className="flex-1"
                    contentFit="cover"
                    accessibilityLabel={image.alt || `Product image ${index + 1}`}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="w-20 h-20 bg-warmGrey rounded-full items-center justify-center mb-md">
                <Text className="text-midGrey text-2xl">📷</Text>
              </View>
              <Text className="text-midGrey text-body">No images available</Text>
            </View>
          )}
        </View>

        {/* Identity Block */}
        <View className="p-lg bg-white border-b border-warmGrey">
          <Text className="text-displayMd font-bold text-charcoal mb-xs">
            {product.content?.title?.en || product.title}
          </Text>
          
          {product.vendor && (
            <Text className="text-caption text-midGrey mb-sm">
              {product.vendor}
            </Text>
          )}

          {/* Price - hidden in client mode unless revealed */}
          {(privacyMode === 'staff' || showPrice) && selectedVariant && (
            <Text className="text-headline font-semibold text-charcoal">
              ${selectedVariant.price}
              {selectedVariant.compareAtPrice && (
                <Text className="text-body text-midGrey line-through ml-sm">
                  ${selectedVariant.compareAtPrice}
                </Text>
              )}
            </Text>
          )}
          
          {privacyMode === 'client' && !showPrice && (
            <Pressable 
              onPress={() => setShowPrice(true)}
              className="min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Tap to reveal price"
            >
              <Text className="text-body text-midGrey underline">
                Tap to view price
              </Text>
            </Pressable>
          )}
        </View>

        {/* Variant Selector */}
        {colorVariants.length > 1 && (
          <View className="p-lg bg-white border-b border-warmGrey">
            <Text className="text-bodyStrong text-charcoal mb-md">
              Available Colors
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {colorVariants.map(variant => (
                <VariantChip
                  key={variant.shopifyId}
                  variant={variant}
                  isSelected={selectedVariantId === variant.shopifyId || (!selectedVariantId && variant === colorVariants[0])}
                  onPress={() => setSelectedVariantId(variant.shopifyId)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dimensions/Details */}
        {product.metafields && Object.keys(product.metafields).length > 0 && (
          <View className="p-lg bg-white border-b border-warmGrey">
            <Text className="text-bodyStrong text-charcoal mb-md">
              Details
            </Text>
            <View className="space-y-sm">
              {Object.entries(product.metafields).map(([key, value]) => (
                <View key={key} className="flex-row justify-between">
                  <Text className="text-body text-charcoal capitalize">
                    {key.replace(/[_-]/g, ' ')}
                  </Text>
                  <Text className="text-body text-midGrey">
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {(product.content?.description?.en || product.description) && (
          <View className="p-lg bg-white border-b border-warmGrey">
            <Text className="text-bodyStrong text-charcoal mb-md">
              Description
            </Text>
            <Text className="text-body text-charcoal leading-relaxed">
              {product.content?.description?.en || product.description}
            </Text>
          </View>
        )}

        {/* Inventory Section - Staff Only */}
        {privacyMode === 'staff' && selectedVariant && (
          <View className="p-lg bg-white border-b border-warmGrey">
            <Text className="text-bodyStrong text-charcoal mb-md">
              Inventory
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-body text-charcoal">
                SKU: {selectedVariant.sku || 'N/A'}
              </Text>
              <StockBadge 
                inventoryQuantity={selectedVariant.inventoryQuantity}
                availableForSale={selectedVariant.availableForSale}
              />
            </View>
          </View>
        )}

        {/* Bottom spacing for ActionBar */}
        <View className="h-24" />
      </ScrollView>

      {/* ActionBar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/90 border-t border-warmGrey p-lg">
        {hasActiveSession ? (
          <Button variant="primary" onPress={handleAddToSession}>
            Add to session
          </Button>
        ) : (
          <Button variant="primary" onPress={handleStartSession}>
            Start session
          </Button>
        )}
      </View>
    </View>
  );
}
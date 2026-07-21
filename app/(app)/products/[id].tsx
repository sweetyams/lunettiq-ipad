import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Heart, Star } from 'lucide-react-native';
import { useProduct } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useCreateProductInteraction } from '@/src/api/useProductInteractions';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { LoadingState, ErrorState, EmptyState, Button, FitBadge, StockDot } from '@/src/ui';
import type { ProductVariant } from '@/src/api/products.types';

// --- Variant Chip ---

interface VariantChipProps {
  variant: ProductVariant;
  isSelected: boolean;
  onPress: () => void;
}

function VariantChip({ variant, isSelected, onPress }: VariantChipProps) {
  const colorOption = variant.selectedOptions.find(
    (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
  );
  const label = colorOption?.value ?? variant.title ?? 'Default';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select ${label} variant${!variant.availableForSale ? ', out of stock' : ''}`}
      accessibilityState={{ selected: isSelected }}
      className={`min-h-[44px] min-w-[44px] px-md py-sm rounded-full items-center justify-center border mr-sm ${
        isSelected
          ? 'bg-brand border-brand'
          : variant.availableForSale
            ? 'bg-bg-elevated border-border'
            : 'bg-bg-surface border-border opacity-50'
      }`}
    >
      <Text
        className={`text-caption font-medium ${
          isSelected ? 'text-brand-text' : 'text-text-primary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// --- Dimensions Table ---

function DimensionsTable({ metafields }: { metafields: Record<string, unknown> }) {
  const custom = (metafields?.custom ?? metafields) as Record<string, unknown>;

  const dimensions = [
    { label: 'Frame width', value: custom.frame_width_mm ?? custom.frame_width },
    { label: 'Bridge', value: custom.bridge_width_mm ?? custom.bridge_width ?? custom.bridge },
    { label: 'Temple', value: custom.temple_length_mm ?? custom.temple_length ?? custom.temple },
    { label: 'Lens height', value: custom.lens_height_mm ?? custom.lens_height },
    { label: 'Lens width', value: custom.lens_width_mm ?? custom.lens_width },
  ].filter((d) => d.value != null && d.value !== '');

  if (dimensions.length === 0) return null;

  return (
    <View className="p-lg bg-bg-elevated border-b border-border">
      <Text className="text-bodyStrong text-text-primary mb-md">Dimensions</Text>
      {dimensions.map((dim) => (
        <View key={dim.label} className="flex-row justify-between py-sm">
          <Text className="text-body text-text-muted">{dim.label}</Text>
          <Text className="text-body text-text-primary font-mono">{String(dim.value)} mm</Text>
        </View>
      ))}
    </View>
  );
}

// --- Screen ---

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { activeClientId, sessionId, mode: sessionMode } = useSessionStore();
  const hasLoggedView = useRef(false);

  const { data: product, isLoading, error, refetch } = useProduct(id ?? '');
  const { data: suggestions } = useSuggestions(activeClientId, { limit: 50 });
  const logInteraction = useCreateProductInteraction();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [showPrice, setShowPrice] = useState(false);

  // Log 'viewed' interaction once per session visit
  useEffect(() => {
    if (product && activeClientId && !hasLoggedView.current) {
      hasLoggedView.current = true;
      logInteraction.mutate({
        clientId: activeClientId,
        productId: product.id ?? product.shopifyId,
        type: 'viewed',
        sessionId,
      });
    }
  }, [product, activeClientId]);

  // Resolve selected variant
  const selectedVariant = selectedVariantId
    ? product?.variants?.find((v) => v.shopifyId === selectedVariantId)
    : product?.variants?.[0];

  // Get fit score for this product
  const fitData = product
    ? suggestions?.find((s) => s.productId === product.id || s.productId === product.shopifyId)
    : null;

  // Color variants for chip selector
  const colorVariants =
    product?.variants?.filter((v) =>
      v.selectedOptions.some(
        (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
      )
    ) ?? [];

  const hasActiveSession = activeClientId && sessionMode !== 'idle';

  // Resolve title
  const title = product
    ? typeof product.title === 'string'
      ? product.title
      : product.title?.en ?? product.title?.fr ?? ''
    : '';

  // Resolve description
  const description = product
    ? typeof product.description === 'string'
      ? product.description
      : (product.description as Record<string, string>)?.en ??
        (product.description as Record<string, string>)?.fr ?? ''
    : '';

  // Actions
  const handleTryInFitting = useCallback(() => {
    if (!product || !activeClientId) return;
    logInteraction.mutate({
      clientId: activeClientId,
      productId: product.id ?? product.shopifyId,
      variantId: selectedVariant?.shopifyId ?? undefined,
      type: 'tried_on',
      sessionId,
    });
    // TODO: Navigate to fitting mode or add to shelf
  }, [product, activeClientId, selectedVariant, sessionId]);

  const handleWishlist = useCallback(() => {
    if (!product || !activeClientId) return;
    logInteraction.mutate({
      clientId: activeClientId,
      productId: product.id ?? product.shopifyId,
      type: 'liked',
      sessionId,
    });
  }, [product, activeClientId, sessionId]);

  // --- Loading / Error / Empty states ---
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!product) return <EmptyState message="Product not found" />;

  return (
    <View className="flex-1 bg-bg-surface">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Back button overlay */}
        <Pressable
          onPress={() => router.back()}
          className="absolute top-lg left-lg z-10 w-[44px] h-[44px] bg-bg-elevated/80 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#171717" />
        </Pressable>

        {/* Hero Image Carousel */}
        <View style={{ height: 400 }} className="bg-bg-elevated">
          {product.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              {product.images.map((image, index) => (
                <View key={index} style={{ width }} className="h-full">
                  <Image
                    source={{ uri: image.url }}
                    className="flex-1"
                    contentFit="contain"
                    accessibilityLabel={image.alt ?? `${title} image ${index + 1}`}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-muted text-body">No images available</Text>
            </View>
          )}
        </View>

        {/* Identity Block */}
        <View className="p-lg bg-bg-elevated border-b border-border">
          <Text className="text-displayMd font-bold text-text-primary mb-xs">
            {title}
          </Text>

          {product.vendor && (
            <Text className="text-caption text-text-muted mb-sm">{product.vendor}</Text>
          )}

          {/* Price */}
          {privacyMode === 'staff' && selectedVariant && (
            <View className="flex-row items-baseline gap-sm">
              <Text className="text-headline font-semibold text-text-primary">
                ${selectedVariant.price}
              </Text>
              {selectedVariant.compareAtPrice && (
                <Text className="text-body text-text-muted line-through">
                  ${selectedVariant.compareAtPrice}
                </Text>
              )}
            </View>
          )}

          {privacyMode === 'client' && !showPrice && (
            <Pressable
              onPress={() => setShowPrice(true)}
              className="min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Tap to reveal price"
            >
              <Text className="text-body text-text-muted underline">Tap to view price</Text>
            </Pressable>
          )}

          {privacyMode === 'client' && showPrice && selectedVariant && (
            <Text className="text-headline font-semibold text-text-primary">
              ${selectedVariant.price}
            </Text>
          )}
        </View>

        {/* Fit Check Band — only when session active and score available */}
        {hasActiveSession && fitData && fitData.score >= 3 && (
          <View className="p-lg bg-bg-elevated border-b border-border flex-row items-center gap-md">
            <FitBadge score={fitData.score} reasons={fitData.matchReasons} />
            {fitData.matchReasons.length > 0 && (
              <Text className="text-caption text-text-muted flex-1" numberOfLines={1}>
                {fitData.matchReasons.join(' · ')}
              </Text>
            )}
          </View>
        )}

        {/* Variant Selector */}
        {colorVariants.length > 1 && (
          <View className="p-lg bg-bg-elevated border-b border-border">
            <Text className="text-bodyStrong text-text-primary mb-md">Available colours</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {colorVariants.map((variant) => (
                <VariantChip
                  key={variant.shopifyId}
                  variant={variant}
                  isSelected={
                    selectedVariantId === variant.shopifyId ||
                    (!selectedVariantId && variant === colorVariants[0])
                  }
                  onPress={() => setSelectedVariantId(variant.shopifyId)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dimensions */}
        {product.metafields && Object.keys(product.metafields).length > 0 && (
          <DimensionsTable metafields={product.metafields} />
        )}

        {/* Description */}
        {description ? (
          <View className="p-lg bg-bg-elevated border-b border-border">
            <Text className="text-bodyStrong text-text-primary mb-md">Description</Text>
            <Text className="text-body text-text-primary leading-relaxed">{description}</Text>
          </View>
        ) : null}

        {/* Inventory — Staff Only */}
        {privacyMode === 'staff' && selectedVariant && (
          <View className="p-lg bg-bg-elevated border-b border-border">
            <Text className="text-bodyStrong text-text-primary mb-md">Inventory</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-body text-text-primary">
                SKU: {selectedVariant.sku ?? 'N/A'}
              </Text>
              <StockDot
                status={
                  !selectedVariant.availableForSale
                    ? 'out'
                    : (selectedVariant.inventoryQuantity ?? 0) <= 3
                      ? 'low'
                      : 'in'
                }
                showLabel
              />
            </View>
            {selectedVariant.inventoryQuantity !== undefined && (
              <Text className="text-caption text-text-muted mt-xs">
                {selectedVariant.inventoryQuantity} units available
              </Text>
            )}
          </View>
        )}

        {/* Bottom spacing for ActionBar */}
        <View className="h-28" />
      </ScrollView>

      {/* ActionBar */}
      <View className="absolute bottom-0 left-0 right-0 bg-bg-elevated/95 border-t border-border px-lg py-md">
        {hasActiveSession ? (
          <View className="flex-row gap-md">
            <View className="flex-1">
              <Button variant="primary" onPress={handleTryInFitting}>
                Try in fitting
              </Button>
            </View>
            <Pressable
              onPress={handleWishlist}
              className="min-h-[44px] min-w-[44px] items-center justify-center border border-border rounded-md px-md"
              accessibilityRole="button"
              accessibilityLabel="Add to wishlist"
            >
              <Heart size={20} color="#171717" />
            </Pressable>
            <Pressable
              onPress={() => {}}
              className="min-h-[44px] min-w-[44px] items-center justify-center border border-border rounded-md px-md"
              accessibilityRole="button"
              accessibilityLabel="Recommend"
            >
              <Star size={20} color="#171717" />
            </Pressable>
          </View>
        ) : (
          <View className="items-center py-sm">
            <Text className="text-body text-text-muted">Start a session to recommend</Text>
          </View>
        )}
      </View>
    </View>
  );
}

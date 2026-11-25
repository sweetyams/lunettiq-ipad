import { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, Glasses, Heart, Plus } from 'lucide-react-native';
import { useProduct } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useCreateProductInteraction } from '@/src/api/useProductInteractions';
import { useProductEnhancement } from '@/src/api/useProductEnhancement';
import { useAddToWishlist } from '@/src/api/useClients';
import { usePromotion, promotionApplies } from '@/src/api/usePromotion';
import { pickFrameVariant, hasRealOptions } from '@/src/features/products/families';
import { frameSizes } from '@/src/features/products/sizing';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { ColourSiblings } from '@/src/ui/ColourSiblings';
import { formatPrice, productTitle } from '@/src/ui/ProductCard';
import { Badge, Button, ChoiceChips, KeyValue, Section, kitColors } from '@/src/ui/kit';
import { ConfiguratorSheet } from '@/src/features/configurator/ConfiguratorSheet';
import { OrderSummarySheet } from '@/src/features/configurator/OrderSummarySheet';
import { toast } from '@/src/ui/useToastStore';
import type { CartResult, ConfiguratorPriceSummary } from '@/src/api/configurator.types';
import { productKey, type ProductVariant } from '@/src/api/products.types';

const colourOf = (v: ProductVariant) => v.selectedOptions.find((o) => /^colou?r$/i.test(o.name))?.value ?? v.title ?? 'Default';
const text = (v: unknown) => (typeof v === 'string' ? v : (v as Record<string, string> | null)?.en ?? (v as Record<string, string> | null)?.fr ?? '');

/** A text metafield's value ("custom.composition": { value }). */
const metaText = (mf: Record<string, unknown> | undefined, key: string) => {
  const v = mf?.[`custom.${key}`] ?? mf?.[key];
  const value = v && typeof v === 'object' && 'value' in (v as object) ? (v as { value: unknown }).value : v;
  return typeof value === 'string' ? value.trim() : '';
};

/** Product detail: photography left, inspector right; visit actions when a visit is open. */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const staff = usePrivacyStore((s) => s.mode) === 'staff';
  const { activeClientId, activeClientName, sessionId, mode, framesTried, addFrameTried } = useSessionStore();
  const inVisit = mode !== 'idle' && !!activeClientId;

  const { data: product, isLoading, error, refetch } = useProduct(id ?? '');
  const { data: suggestions } = useSuggestions(inVisit ? activeClientId : null, { limit: 50 });
  const { data: enhancement } = useProductEnhancement(product?.shopifyId ?? null);
  const logInteraction = useCreateProductInteraction();
  const addToWishlist = useAddToWishlist();

  const [variantId, setVariantId] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [ordering, setOrdering] = useState<{ cart?: CartResult; price?: ConfiguratorPriceSummary } | null>(null);
  const { data: promo } = usePromotion();
  const [saved, setSaved] = useState(false);
  const logged = useRef<string | null>(null);

  useEffect(() => { setVariantId(null); setPhoto(0); setSaved(false); }, [id]);

  // One "viewed" per product per visit.
  useEffect(() => {
    if (!product || !inVisit || logged.current === product.shopifyId) return;
    logged.current = product.shopifyId;
    logInteraction.mutate({ clientId: activeClientId!, productId: product.id ?? product.shopifyId, type: 'viewed', sessionId });
  }, [product, inVisit, activeClientId, sessionId, logInteraction]);

  // Lunettiq's variants are legacy lens options (BLACK FADE, POLARIZED…): never shown. Only real colour/size options are.
  const realOptions = useMemo(() => hasRealOptions(product?.variants ?? []), [product?.variants]);
  const colourVariants = useMemo(() => {
    const seen = new Set<string>();
    return (product?.variants ?? []).filter((v) => {
      const c = colourOf(v).toLowerCase();
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
  }, [product?.variants]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!product) return <EmptyState message="Frame not found" />;

  const title = productTitle(product);
  const variant = (realOptions ? product.variants?.find((v) => v.shopifyId === variantId) : undefined) ?? pickFrameVariant(product.variants);
  const key = productKey(product);
  const inTray = framesTried.some((f) => f.productId === key);
  const fit = inVisit ? suggestions?.find((s) => s.productId === key || s.productId === product.id) : undefined;
  const dims = frameSizes(product.metafields as Record<string, unknown> | undefined);
  const composition = metaText(product.metafields as Record<string, unknown> | undefined, 'composition')
    .split(/\r?\n/).map((l) => l.replace(/^[*\-•]\s*/, '').trim()).filter(Boolean);
  const onPromo = promotionApplies(promo, product.shopifyId);
  const lensesDone = !(inVisit && staff);
  const description = text(product.description);
  const stock = variant ? (!variant.availableForSale ? 'out' : (variant.inventoryQuantity ?? 99) <= 3 ? 'low' : 'in') : product.viewHints?.stockBucket;
  const images = product.images.length ? product.images : variant?.imageUrl ? [{ url: variant.imageUrl, alt: title }] : [];
  const galleryWidth = Math.min(width * 0.55, 760);

  const addToTray = () => {
    if (inTray) return;
    addFrameTried({
      id: `${key}-${Date.now()}`, productId: key, productName: title, variantId: variant?.shopifyId,
      imageUrl: images[0]?.url, verdict: undefined, notes: '', photoIds: [], triedAt: Date.now(),
    });
    toast.success('Added to the tray', `${title} · ${activeClientName ?? 'visit'}`);
  };

  const save = async () => {
    if (!activeClientId || !variant) return;
    try {
      await addToWishlist.mutateAsync({ clientId: activeClientId, variantId: variant.shopifyId });
      setSaved(true);
      toast.success('Saved to their wishlist', title);
    } catch {
      toast.error('Couldn’t save to the wishlist', 'Check the connection and try again.');
    }
  };

  return (
    <View className="flex-1 bg-bg-page">
      <View className="flex-row items-center gap-[12px] px-[32px] py-[12px] border-b border-border">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-[4px] min-h-[44px] -ml-[6px]" accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={20} color={kitColors.textTertiary} />
          <Text className="text-body-md text-text-tertiary">Frames</Text>
        </Pressable>
        <View className="flex-1" />
        {inVisit ? (
          <>
            {staff ? (
              <Button label={saved ? 'Saved' : 'Save to wishlist'} icon={Heart} variant="ghost" onPress={save} disabled={saved || !variant} loading={addToWishlist.isPending} />
            ) : null}
            <Button label="Choose lenses" icon={Glasses} onPress={() => setOrdering({})} />
            <Button label={inTray ? 'In the tray' : 'Add to tray'} icon={Plus} variant="primary" onPress={addToTray} disabled={inTray} />
          </>
        ) : (
          <>
            <Button label="Choose lenses" icon={Glasses} onPress={() => setOrdering({})} />
          </>
        )}
      </View>

      <View className="flex-1 flex-row">
        {/* Photography */}
        <View style={{ width: galleryWidth }} className="border-r border-border">
          <View className="flex-1 items-center justify-center">
            {images[photo] ? (
              <Image source={{ uri: images[photo]!.url }} contentFit="contain" style={{ width: '90%', height: '80%' }} accessibilityLabel={images[photo]!.alt ?? title} />
            ) : (
              <Text className="text-body-md text-text-dim">No photo</Text>
            )}
          </View>
          {images.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, padding: 16 }} className="flex-grow-0 border-t border-border">
              {images.map((img, i) => (
                <Pressable key={`${img.url}-${i}`} onPress={() => setPhoto(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}`} accessibilityState={{ selected: i === photo }}>
                  <View className={`w-[88px] h-[66px] rounded-md overflow-hidden items-center justify-center ${i === photo ? 'border-2 border-accent' : 'border border-border'}`}>
                    <Image source={{ uri: img.url }} contentFit="contain" style={{ width: '90%', height: '90%' }} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Inspector */}
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 28, paddingBottom: 140, gap: 20 }}>
          <View className="gap-[6px]">
            <Text className="text-display-lg text-text-primary">{title}</Text>
            <View className="flex-row items-center gap-[10px] flex-wrap">
              {staff && formatPrice(variant?.price ?? product.priceMin) ? (
                <Text className="text-heading-lg text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{formatPrice(variant?.price ?? product.priceMin)}</Text>
              ) : null}
              {staff && variant?.compareAtPrice ? <Text className="text-body-md text-text-tertiary line-through">{formatPrice(variant.compareAtPrice)}</Text> : null}
              {stock === 'out' ? <Badge tone="danger">Out of stock</Badge> : stock === 'low' ? <Badge tone="warning">Low stock</Badge> : stock === 'in' ? <Badge tone="success" dot>In stock</Badge> : null}
              {inTray ? <Badge tone="info">In the tray</Badge> : null}
              {onPromo && promo?.messages?.badge?.en ? <Badge tone="info">{promo.messages.badge.en}</Badge> : null}
            </View>
            {product.vendor ? <Text className="text-body-md text-text-tertiary">{product.vendor}</Text> : null}
          </View>

          {fit && fit.score >= 3 ? (
            <Section title="Fit for this client">
              <View className="flex-row items-center gap-[10px]">
                <Badge tone="success" dot>{fit.score >= 5 ? 'Good fit' : 'Close fit'}</Badge>
                {fit.matchReasons?.length ? <Text className="text-body-sm text-text-secondary flex-1">{fit.matchReasons.join(' · ')}</Text> : null}
              </View>
            </Section>
          ) : null}

          {product.shopifyId ? <ColourSiblings productId={product.shopifyId} currentHandle={product.handle} /> : null}

          {realOptions && colourVariants.length > 1 ? (
            <View className="gap-[8px]">
              <Text className="text-body-sm font-medium text-text-secondary">
                {colourVariants.some((v) => v.selectedOptions.some((o) => /^colou?r$/i.test(o.name))) ? 'Colour' : 'Version'}
              </Text>
              <ChoiceChips
                options={colourVariants.map((v) => ({ key: v.shopifyId, label: `${colourOf(v).charAt(0)}${colourOf(v).slice(1).toLowerCase()}${v.availableForSale ? '' : ' · out of stock'}` }))}
                value={variant?.shopifyId ?? null}
                onChange={(k: string | null) => k && setVariantId(k)}
              />
            </View>
          ) : null}

          {dims.length ? <Section title="Size"><KeyValue mono rows={dims} /></Section> : null}
          {onPromo && promo?.messages?.banner?.en ? (
            <Section title={promo.title?.en ?? 'Promotion'}><Text className="text-body-md text-text-primary">{promo.messages.banner.en}</Text></Section>
          ) : null}

          {staff && variant && (variant.sku || variant.inventoryQuantity != null) ? (
            <Section title="Stock">
              <KeyValue mono rows={[
                { label: 'SKU', value: variant.sku },
                { label: 'On hand', value: variant.inventoryQuantity != null ? String(variant.inventoryQuantity) : null },
              ]} />
            </Section>
          ) : null}

          {enhancement?.fittingGuidance?.en ? (
            <Section title="Fitting guidance"><Text className="text-body-md text-text-primary">{enhancement.fittingGuidance.en}</Text></Section>
          ) : null}
          {description ? <Section title="About"><Text className="text-body-md text-text-primary">{description}</Text></Section> : null}
          {composition.length ? (
            <Section title="Details">
              <View className="gap-[4px]">{composition.map((line) => <Text key={line} className="text-body-md text-text-secondary">· {line}</Text>)}</View>
            </Section>
          ) : null}
          {enhancement?.story?.en ? <Section title="Story"><Text className="text-body-md text-text-secondary">{enhancement.story.en}</Text></Section> : null}
        </ScrollView>
      </View>

      {ordering && !ordering.cart ? (
        <ConfiguratorSheet
          visible
          productId={product.id ?? product.shopifyId}
          productName={title}
          variantId={variant?.shopifyId}
          basePrice={variant ? Math.round(Number(variant.price) * 100) : 0}
          completeLabel={lensesDone ? 'Done' : 'Continue to order'}
          onClose={() => setOrdering(null)}
          onComplete={(cart, price) => {
            if (!lensesDone) { setOrdering({ cart, price }); return; }
            // Outside a visit it's a price walk-through: no order without a client.
            setOrdering(null);
            toast.success(`With these lenses: ${formatPrice(price.total / 100) ?? ''}`, inVisit ? 'Switch to staff mode to order.' : 'Start a visit to order them for a client.');
          }}
        />
      ) : null}
      {ordering?.cart && ordering.price ? (
        <OrderSummarySheet
          visible
          productId={product.id ?? product.shopifyId}
          productName={title}
          variantId={variant?.shopifyId}
          cartResult={ordering.cart}
          priceSummary={ordering.price}
          clientId={activeClientId ?? undefined}
          sessionId={sessionId ?? undefined}
          onClose={() => setOrdering(null)}
          onOrderCreated={() => { setOrdering(null); toast.success('Order created', 'It’s in Orders.'); }}
        />
      ) : null}
    </View>
  );
}

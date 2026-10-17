import { View, Text, Pressable, TextInput, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Image } from 'expo-image';
import { Camera, Check, Search, Smartphone, ChevronRight } from 'lucide-react-native';

import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useClient, useClientEnrichment, useClientPreferences } from '@/src/api/useClients';
import { useInsuranceProfile } from '@/src/api/useMultiPair';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import type { FrameTried } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar } from '@/src/ui/Avatar';
import { ProductCard } from '@/src/ui/ProductCard';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { toast } from '@/src/ui/useToastStore';
import {
  Badge, Button, FilterChips, KeyValue, Section, StatusDot, TextField, VerdictPicker, kitColors,
} from '@/src/ui/kit';
import { EndSessionSheet } from '@/src/features/session/EndSessionSheet';
import { ConfiguratorSheet } from '@/src/features/configurator/ConfiguratorSheet';
import { OrderSummarySheet } from '@/src/features/configurator/OrderSummarySheet';
import type { CartResult, ConfiguratorPriceSummary } from '@/src/api/configurator.types';
import { productKey, type Product, type ProductListParams } from '@/src/api/products.types';

type SortOption = 'best-match' | 'price-asc' | 'price-desc';

const titleOf = (p: Product) => (typeof p.title === 'string' ? p.title : p.title?.en ?? p.title?.fr ?? '');

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return '0:00';
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const handToClient = usePrivacyStore((s) => s.handToClient);
  const {
    mode, activeClientId, sessionId, sessionStartedAt, framesTried, sessionNotes,
    setSessionNotes, addFrameTried, updateFrameVerdict, startFitting,
  } = useSessionStore();

  const { data: client, isLoading: clientLoading, error: clientError, refetch: refetchClient } = useClient(id);
  const { data: enrichment } = useClientEnrichment(id);
  const { data: preferences } = useClientPreferences(id);
  const { data: insurance } = useInsuranceProfile(id);
  const elapsed = useElapsed(sessionStartedAt);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best-match');
  const queryParams: ProductListParams = { q: search || undefined, limit: 50, offset: 0 };
  const { data: productsResponse, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts(queryParams);
  const products = productsResponse?.data ?? [];
  const { data: suggestions } = useSuggestions(id, { limit: 12 });

  const [showEnd, setShowEnd] = useState(false);
  // Order flow: configurator → summary, for one tray frame.
  const [ordering, setOrdering] = useState<{ product: Product; cart?: CartResult; price?: ConfiguratorPriceSummary } | null>(null);

  const inTray = useMemo(() => new Set(framesTried.map((f) => f.productId)), [framesTried]);
  const suggested = useMemo(() => new Set((suggestions ?? []).map((s: { productId: string }) => s.productId)), [suggestions]);

  const sorted = useMemo(() => [...products].sort((a, b) => {
    if (sortBy === 'price-asc') return parseFloat(a.priceMin ?? '0') - parseFloat(b.priceMin ?? '0');
    if (sortBy === 'price-desc') return parseFloat(b.priceMax ?? '0') - parseFloat(a.priceMax ?? '0');
    return Number(suggested.has(productKey(b))) - Number(suggested.has(productKey(a)));
  }), [products, sortBy, suggested]);

  const addToTray = useCallback((key: string) => {
    const product = products.find((p) => productKey(p) === key || p.id === key);
    if (!product) return;
    if (inTray.has(productKey(product))) {
      toast.info('Already in the tray', titleOf(product));
      return;
    }
    addFrameTried({
      id: `${productKey(product)}-${Date.now()}`,
      productId: productKey(product),
      productName: titleOf(product),
      imageUrl: product.images[0]?.url,
      verdict: undefined,
      notes: '',
      photoIds: [],
      triedAt: Date.now(),
    });
  }, [products, inTray, addFrameTried]);

  const startOrder = useCallback((frame: FrameTried) => {
    const product = products.find((p) => productKey(p) === frame.productId);
    if (!product) {
      toast.info('Find the frame first', 'Search the catalogue for it, then order from the tray.');
      return;
    }
    setOrdering({ product });
  }, [products]);

  const fitRange = enrichment?.frameWidthMm && enrichment?.bridgeWidthMm
    ? `${Math.max(44, enrichment.frameWidthMm - 3)}–${enrichment.frameWidthMm + 3} □ ${enrichment.bridgeWidthMm - 2}–${enrichment.bridgeWidthMm + 2}`
    : null;
  const pairsLeft = insurance?.provider ? Math.max(0, insurance.pairsAllowed - insurance.pairsUsed) : null;

  if (mode === 'idle' || activeClientId !== id) {
    return (
      <View className="flex-1 bg-bg-page items-center justify-center gap-[12px]">
        <Text className="text-heading-lg text-text-primary">No visit in progress</Text>
        <Text className="text-body-md text-text-tertiary">Start a visit from Floor or the client’s profile.</Text>
        <Button label="Back to Floor" onPress={() => router.replace('/home')} />
      </View>
    );
  }
  if (clientLoading) return <LoadingState />;
  if (clientError) return <ErrorState error={clientError} onRetry={refetchClient} />;
  if (!client) return <EmptyState message="Client not found" />;

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'No name yet';
  const tier = (client.tags ?? []).find((t) => t.startsWith('member-'))?.replace('member-', '').toUpperCase();
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length;

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="flex-row items-center gap-[16px] px-[32px] py-[16px] border-b border-border">
        <Pressable onPress={() => router.push(`/clients/${id}`)} accessibilityRole="button" accessibilityLabel={`Open ${name}'s profile`} className="flex-row items-center gap-[12px] flex-shrink">
          <Avatar firstName={client.firstName ?? ''} lastName={client.lastName ?? ''} size="md" />
          <View className="flex-shrink">
            <View className="flex-row items-center gap-[8px]">
              <Text className="text-heading-lg text-text-primary" numberOfLines={1}>{name}</Text>
              {tier ? <Badge tone="info">{tier}</Badge> : null}
            </View>
            <View className="flex-row items-center gap-[8px] mt-[2px]">
              <StatusDot tone="success" />
              <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
                Visit · {elapsed} · {framesTried.length} tried{loved ? ` · ${loved} loved` : ''}
              </Text>
            </View>
          </View>
        </Pressable>
        <View className="flex-1" />
        <Button label="Hand to client" icon={Smartphone} variant="ghost" onPress={handToClient} />
        <Button label="Fitting photos" icon={Camera} variant="ghost" onPress={() => { startFitting(); router.push(`/clients/${id}/fitting`); }} />
        <Button label="End visit" variant="primary" onPress={() => setShowEnd(true)} />
      </View>

      <View className="flex-1 flex-row">
        {/* Catalogue */}
        <View className="flex-1 px-[24px] pt-[20px]">
          <View className="flex-row items-center gap-[10px] border border-border rounded-md px-[12px] min-h-[44px] bg-bg-page">
            <Search size={18} color={kitColors.iconMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search frames by name, shape or colour"
              placeholderTextColor={kitColors.iconMuted}
              className="flex-1 text-body-md text-text-primary"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search frames"
            />
          </View>
          <View className="flex-row items-center gap-[12px] mt-[12px]">
            <View className="flex-shrink">
              <FilterChips<SortOption>
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { key: 'best-match', label: 'Best match' },
                  { key: 'price-asc', label: 'Price: low to high' },
                  { key: 'price-desc', label: 'Price: high to low' },
                ]}
              />
            </View>
            <View className="flex-1" />
            {fitRange ? <Badge tone="info">{`Fits ${fitRange}`}</Badge> : null}
          </View>

          {productsLoading ? (
            <LoadingState />
          ) : productsError ? (
            <ErrorState error={productsError} onRetry={refetchProducts} />
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item) => productKey(item)}
              numColumns={4}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 140 }}
              ListHeaderComponent={
                <Text className="text-body-sm text-text-tertiary px-[4px] pb-[8px]">
                  {sorted.length} frames · tap to add to the tray
                </Text>
              }
              ListEmptyComponent={<EmptyState message={search ? `No frames match “${search}”.` : 'No frames in the catalogue.'} />}
              renderItem={({ item }) => {
                const added = inTray.has(productKey(item));
                return (
                  <View className="flex-1 m-[6px]" style={{ maxWidth: '25%' }}>
                    <ProductCard product={item} onPress={addToTray} />
                    {added ? (
                      <View className="absolute top-[8px] left-[8px] flex-row items-center gap-[4px] bg-accent rounded-full px-[8px] py-[2px]" pointerEvents="none">
                        <Check size={12} color={kitColors.inverse} strokeWidth={2.5} />
                        <Text className="text-body-sm font-medium text-accent-text">In tray</Text>
                      </View>
                    ) : suggested.has(productKey(item)) ? (
                      <View className="absolute top-[8px] left-[8px]" pointerEvents="none"><Badge tone="info">Suggested</Badge></View>
                    ) : null}
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Visit rail */}
        <ScrollView
          className="w-[400px] flex-grow-0 border-l border-border"
          contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="Tray" count={framesTried.length || undefined} padded={framesTried.length === 0}>
            {framesTried.length === 0 ? (
              <Text className="text-body-sm text-text-tertiary">Tap frames in the catalogue as they try them on. Record a reaction for each; it drives follow-ups.</Text>
            ) : (
              framesTried.slice().reverse().map((frame, i) => {
                const isLoved = frame.verdict === 'loved' || frame.verdict === 'liked';
                return (
                  <View key={frame.id} className={`px-[16px] py-[12px] gap-[10px] ${i > 0 ? 'border-t border-border' : ''}`}>
                    <View className="flex-row items-center gap-[12px]">
                      <View className="w-[56px] h-[40px] rounded-sm border border-border overflow-hidden items-center justify-center">
                        {frame.imageUrl ? <Image source={{ uri: frame.imageUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} /> : null}
                      </View>
                      <Text className="flex-1 text-body-md font-medium text-text-primary" numberOfLines={2}>{frame.productName}</Text>
                      {isLoved ? <Button label="Order" size="sm" onPress={() => startOrder(frame)} /> : null}
                    </View>
                    <VerdictPicker value={frame.verdict} onChange={(v) => updateFrameVerdict(frame.id, v)} label={frame.productName} />
                  </View>
                );
              })
            )}
          </Section>

          <Section title="Client" action={{ label: 'Profile', onPress: () => router.push(`/clients/${id}`) }}>
            <KeyValue
              rows={[
                { label: 'Fit', value: fitRange },
                { label: 'Likes', value: preferences?.stated?.shapes?.length ? preferences.stated.shapes.join(', ') : null },
                { label: 'Avoid', value: preferences?.stated?.avoid?.length ? <Text className="text-body-md text-error flex-shrink text-right" numberOfLines={1}>{preferences.stated.avoid.join(', ')}</Text> : null },
                { label: 'Insurance', value: pairsLeft == null ? null : `${pairsLeft} ${pairsLeft === 1 ? 'pair' : 'pairs'} left` },
                { label: 'Orders', value: String(client.orderCount ?? 0) },
              ]}
            />
          </Section>

          <Section title="Visit notes">
            <TextField label="Notes" hint="Saved to their history when the visit ends." value={sessionNotes} onChangeText={setSessionNotes} placeholder="What they’re after, budget, who it’s for" multiline />
          </Section>

          <Pressable onPress={() => router.push(`/clients/${id}`)} className="flex-row items-center justify-center gap-[4px] min-h-[44px]" accessibilityRole="button">
            <Text className="text-body-sm text-text-tertiary">Prescription, history and more on the profile</Text>
            <ChevronRight size={16} color={kitColors.iconMuted} />
          </Pressable>
        </ScrollView>
      </View>

      {ordering && !ordering.cart ? (
        <ConfiguratorSheet
          visible
          productId={ordering.product.id ?? ordering.product.shopifyId}
          productName={titleOf(ordering.product)}
          basePrice={ordering.product.priceMin ? Math.round(Number(ordering.product.priceMin) * 100) : 0}
          onClose={() => setOrdering(null)}
          onComplete={(cart, price) => setOrdering((o) => (o ? { ...o, cart, price } : o))}
        />
      ) : null}
      {ordering?.cart && ordering.price ? (
        <OrderSummarySheet
          visible
          productId={ordering.product.id ?? ordering.product.shopifyId}
          productName={titleOf(ordering.product)}
          cartResult={ordering.cart}
          priceSummary={ordering.price}
          clientId={id}
          sessionId={sessionId ?? undefined}
          onClose={() => setOrdering(null)}
          onOrderCreated={() => {
            setOrdering(null);
            toast.success('Order created', 'It’s in Orders. End the visit as “Purchased” when you’re done.');
          }}
        />
      ) : null}

      <EndSessionSheet
        visible={showEnd}
        onDismiss={() => setShowEnd(false)}
        onComplete={() => { setShowEnd(false); router.replace('/home'); }}
      />
    </View>
  );
}

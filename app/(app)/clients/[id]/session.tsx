import { View, Text, Pressable, TextInput, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ExternalLink } from 'lucide-react-native';

import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useClient, useClientEnrichment, useClientPreferences } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import type { FrameTried } from '@/src/features/session/useSessionStore';
import { Avatar, Button, Chip, Tag, RowKV, ProductCard, LoadingState, ErrorState, EmptyState } from '@/src/ui';
import { FilterSheet } from '@/src/ui/FilterSheet';
import { useFilters } from '@/src/api/useFilters';
import type { Product, ProductListParams } from '@/src/api/products.types';

type SortOption = 'best-match' | 'newest' | 'price-asc' | 'price-desc';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    mode,
    activeClientId,
    activeClientName,
    sessionStartedAt,
    framesTried,
    sessionNotes,
    setSessionNotes,
    endSession,
    addFrameTried,
    updateFrameVerdict,
    startFitting,
  } = useSessionStore();

  // API data
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id);
  const { data: enrichment } = useClientEnrichment(id);
  const { data: preferences } = useClientPreferences(id);

  // Product state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best-match');
  const [showFilters, setShowFilters] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [sessionDuration, setSessionDuration] = useState('00:00');

  const queryParams: ProductListParams = { q: search || undefined, limit: 50, offset: 0 };
  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useProducts(queryParams);
  const products = productsResponse?.data ?? [];
  const { data: filterData } = useFilters();
  const { data: suggestions } = useSuggestions(id, { limit: 12 });

  // Timer
  useEffect(() => {
    if (!sessionStartedAt) return;
    const tick = () => {
      const ms = Date.now() - sessionStartedAt;
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      setSessionDuration(`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  // Sort products
  const sortedProducts = [...products].sort((a: Product, b: Product) => {
    const sugs = suggestions ?? [];
    switch (sortBy) {
      case 'price-asc':
        return (parseFloat(a.priceMin ?? '0')) - (parseFloat(b.priceMin ?? '0'));
      case 'price-desc':
        return (parseFloat(b.priceMax ?? '0')) - (parseFloat(a.priceMax ?? '0'));
      case 'best-match':
      default:
        const aS = sugs.some((s: { productId: string }) => s.productId === a.id);
        const bS = sugs.some((s: { productId: string }) => s.productId === b.id);
        if (aS && !bS) return -1;
        if (!aS && bS) return 1;
        return 0;
    }
  });

  // Handlers
  const handleAddFrame = useCallback((productId: string) => {
    const product = products.find((p: Product) => p.id === productId || p.shopifyId === productId);
    if (!product) return;
    const title = typeof product.title === 'string' ? product.title : product.title?.en ?? '';
    addFrameTried({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: title,
      verdict: undefined,
      notes: '',
      photoIds: [],
      triedAt: Date.now(),
    });
  }, [products, addFrameTried]);

  const handleEndSession = useCallback(() => {
    endSession();
    router.replace('/home');
  }, [endSession, router]);

  const handleCaptureFitting = useCallback(() => {
    startFitting();
    router.push(`/clients/${id}/fitting`);
  }, [startFitting, router, id]);

  // Fit range from enrichment
  const fitRange = enrichment?.frameWidthMm && enrichment?.bridgeWidthMm
    ? `${Math.max(44, enrichment.frameWidthMm - 3)}–${enrichment.frameWidthMm + 3} □ ${enrichment.bridgeWidthMm - 2}–${enrichment.bridgeWidthMm + 2}`
    : null;

  // Guard
  if (mode !== 'session' || activeClientId !== id) {
    return (
      <View className="flex-1 bg-bg-page justify-center items-center">
        <Text className="text-heading-xl text-text-primary">No active session</Text>
        <Text className="text-body-md text-text-secondary mt-sm">Start a session to continue</Text>
        <Button variant="primary" onPress={() => router.replace('/home')} className="mt-lg">
          Return to Home
        </Button>
      </View>
    );
  }

  if (clientLoading) return <LoadingState />;
  if (clientError) return <ErrorState error={clientError} onRetry={() => {}} />;
  if (!client) return <EmptyState message="Client not found" />;

  return (
    <View className="flex-1 bg-bg-page">
      {/* ─── Session Bar (dark) ─── */}
      <View className="flex-row items-center gap-md px-lg py-[12px] bg-chrome-bg">
        {/* Pill */}
        <View className="flex-row items-center gap-[10px] px-[14px] py-[7px] rounded-full border border-chrome-border">
          <View className="w-[8px] h-[8px] rounded-full bg-error" />
          <Text className="text-body-sm text-chrome-text">
            Session · {activeClientName} · <Text className="font-mono">{sessionDuration}</Text>
          </Text>
        </View>

        <View className="flex-1" />

        {/* Actions */}
        <Pressable
          onPress={() => {}}
          className="min-h-[38px] px-[14px] rounded-sm border border-chrome-border flex-row items-center gap-sm"
          accessibilityRole="button"
          accessibilityLabel="Hand to client"
        >
          <Text className="text-body-sm font-medium text-chrome-text">Hand to client</Text>
        </Pressable>

        <Pressable
          onPress={handleCaptureFitting}
          className="min-h-[38px] px-[14px] rounded-sm border border-chrome-border flex-row items-center gap-sm"
          accessibilityRole="button"
          accessibilityLabel="Capture fitting photos"
        >
          <Text className="text-body-sm font-medium text-chrome-text">Capture fitting photos</Text>
        </Pressable>

        <Pressable
          onPress={handleEndSession}
          className="min-h-[38px] px-[14px] rounded-sm bg-text-inverse border border-text-inverse flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="End session"
        >
          <Text className="text-body-sm font-medium text-text-primary">End session</Text>
        </Pressable>
      </View>

      {/* ─── Split: Catalogue + Rail ─── */}
      <View className="flex-1 flex-row">
        {/* Left: Product Catalogue */}
        <View className="flex-1 border-r border-border p-lg">
          {/* Search + Filter */}
          <View className="flex-row gap-md items-center">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${products.length} frames`}
              placeholderTextColor="rgba(29,31,33,0.45)"
              className="flex-1 border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary"
              autoCapitalize="none"
            />
            <Button variant="ghost" onPress={() => setShowFilters(true)}>Filter</Button>
          </View>

          {/* Sort Chips + Fit Filter */}
          <View className="flex-row flex-wrap gap-sm mt-md">
            {([
              { key: 'best-match' as const, label: 'Best match' },
              { key: 'newest' as const, label: 'Newest' },
              { key: 'price-asc' as const, label: 'Price ↑' },
              { key: 'price-desc' as const, label: 'Price ↓' },
            ]).map((s) => (
              <Chip key={s.key} label={s.label} variant={sortBy === s.key ? 'on' : 'default'} onPress={() => setSortBy(s.key)} />
            ))}
            {fitRange && (
              <View className="border border-brand rounded-sm min-h-[36px] px-[12px] flex-row items-center">
                <Text className="text-body-sm text-brand font-mono">Fits {fitRange}</Text>
              </View>
            )}
          </View>

          {/* Count */}
          <Text className="text-body-sm text-text-muted mt-md">
            <Text className="font-mono">{sortedProducts.length}</Text> of <Text className="font-mono">{products.length}</Text> frames
            {preferences?.stated?.shapes?.length ? ' fit and match preferences' : ''}
          </Text>

          {/* Product Grid — 4 columns */}
          {productsLoading ? (
            <LoadingState />
          ) : productsError ? (
            <ErrorState error={productsError} onRetry={() => {}} />
          ) : (
            <FlatList
              data={sortedProducts}
              renderItem={({ item }) => (
                <View className="flex-1 m-[4px]">
                  <ProductCard product={item} onPress={handleAddFrame} />
                </View>
              )}
              keyExtractor={(item) => item.id}
              numColumns={4}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 16 }}
              ListEmptyComponent={<EmptyState message="No frames match" />}
            />
          )}
        </View>

        {/* Right: Session Rail (380px) */}
        <View className="w-[380px] flex-col">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Client Summary */}
            <View className="px-lg py-md border-b border-border">
              <View className="flex-row items-center justify-between mb-[10px]">
                <Text className="text-caption-md tracking-widest uppercase text-text-muted">Client</Text>
                <Pressable onPress={() => router.push(`/clients/${id}`)} hitSlop={8}>
                  <Text className="text-body-xs font-medium text-brand">Open profile</Text>
                </Pressable>
              </View>
              <View className="flex-row items-center gap-[12px] mb-[12px]">
                <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />
                <View>
                  <Text className="text-body-md font-medium text-text-primary">
                    {client.firstName} {client.lastName}
                  </Text>
                  <Text className="text-body-sm text-text-muted">
                    {(client.tags ?? []).find(t => t.startsWith('member-'))?.replace('member-', '').toUpperCase() ?? 'Essential'} · <Text className="font-mono">{client.orderCount ?? 0}</Text> orders
                  </Text>
                </View>
              </View>
              <RowKV label="Fit range" value={fitRange ?? '—'} mono />
              <RowKV label="Prefers" value={preferences?.stated?.shapes?.join(' · ') ?? '—'} />
              <RowKV label="Avoid" value={
                preferences?.stated?.avoid?.length
                  ? <Text className="text-body-sm text-error">{preferences.stated.avoid.join(' · ')}</Text>
                  : '—'
              } />
              <RowKV label="Second-pair budget" value="$200–400" mono />
              <RowKV label="Insurance left" value="—" mono isLast />
            </View>

            {/* AI Stylist */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-[10px]">AI stylist</Text>
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="What is she looking for today?"
                placeholderTextColor="rgba(29,31,33,0.45)"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary mb-sm"
              />
              <Button variant="ghost" block onPress={() => {}}>Suggest frames</Button>
              <Button variant="quiet" block onPress={() => {}} className="mt-sm">
                Multi-pair suggestions →
              </Button>
            </View>

            {/* Session Tray */}
            <View className="px-lg py-md border-b border-border flex-1">
              <View className="flex-row items-baseline justify-between mb-[10px]">
                <Text className="text-caption-md tracking-widest uppercase text-text-muted">
                  Session tray · <Text className="font-mono tracking-normal normal-case">{framesTried.length} frames</Text>
                </Text>
                <Pressable hitSlop={8}>
                  <Text className="text-body-xs font-medium text-brand">Photos ({framesTried.reduce((n, f) => n + f.photoIds.length, 0)})</Text>
                </Pressable>
              </View>
              {framesTried.length === 0 ? (
                <Text className="text-body-sm text-text-muted">Add frames from the catalogue to build the tray.</Text>
              ) : (
                framesTried.map((frame) => (
                  <TrayEntry key={frame.id} frame={frame} onVerdictChange={updateFrameVerdict} />
                ))
              )}
            </View>

            {/* Session Notes */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-[10px]">Session notes</Text>
              <TextInput
                value={sessionNotes}
                onChangeText={setSessionNotes}
                placeholder="Saved to History when the session ends"
                placeholderTextColor="rgba(29,31,33,0.45)"
                multiline
                className="border border-border rounded-sm bg-bg-surface px-[12px] py-sm min-h-[88px] text-body-md text-text-primary"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Pinned CTA */}
          <View className="px-lg py-md border-t border-border">
            <Button variant="primary" block onPress={() => {}}>
              Create order from tray
            </Button>
          </View>
        </View>
      </View>

      {/* Filter Sheet */}
      {showFilters && (
        <FilterSheet
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filterData={filterData}
          selectedFacets={{}}
          selectedStock={[]}
          onFacetToggle={() => {}}
          onStockToggle={() => {}}
          onClear={() => {}}
          activeCount={0}
        />
      )}
    </View>
  );
}

// --- Tray Entry ---
function TrayEntry({ frame, onVerdictChange }: { frame: FrameTried; onVerdictChange: (id: string, v: FrameTried['verdict']) => void }) {
  const verdictLabel: Record<string, { text: string; variant: 'ok' | 'warn' | 'err' | 'default' }> = {
    loved: { text: 'Loved', variant: 'ok' },
    liked: { text: 'Liked', variant: 'default' },
    unsure: { text: 'Unsure', variant: 'warn' },
    rejected: { text: 'No', variant: 'err' },
  };

  const v = frame.verdict ? verdictLabel[frame.verdict] : null;

  return (
    <View className="flex-row items-center gap-[10px] py-sm border-b border-bg-muted">
      <View className="w-[48px] h-[32px] rounded-sm bg-bg-muted" />
      <Text className="text-body-sm text-text-primary flex-1" numberOfLines={1}>{frame.productName}</Text>
      {v ? (
        <Tag label={v.text} variant={v.variant} />
      ) : (
        <Pressable onPress={() => onVerdictChange(frame.id, 'loved')} hitSlop={8}>
          <Text className="text-caption-md text-text-muted">Set verdict</Text>
        </Pressable>
      )}
    </View>
  );
}

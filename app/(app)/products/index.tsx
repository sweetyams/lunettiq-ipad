import { View, Text, FlatList, TextInput, useWindowDimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ScanLine, Search, SlidersHorizontal } from 'lucide-react-native';
import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useFilters } from '@/src/api/useFilters';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { ProductCard, gridColumns } from '@/src/ui/ProductCard';
import { FilterSheet } from '@/src/ui/FilterSheet';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Badge, Button, FilterChips, PageHeader, kitColors } from '@/src/ui/kit';
import { productKey, type ProductListParams } from '@/src/api/products.types';
import { groupByFamily, eyewearType, type EyewearType, type FrameFamily } from '@/src/features/products/families';
import { usePromotion, promotionApplies } from '@/src/api/usePromotion';

type Sort = 'newest' | 'best-match' | 'price-asc' | 'price-desc';
type Kind = 'all' | EyewearType;
// The whole catalogue in one page (158 frames on the demo store): families need every colour to group.
const PAGE = 300;

const familyLine = (f: FrameFamily) => {
  const colours = f.colours.length > 1 ? `${f.colours.length} colours` : f.colours[0] ? f.colours[0].charAt(0) + f.colours[0].slice(1).toLowerCase() : null;
  const kinds = f.types.length === 2 ? 'Optical & sun' : f.types[0] === 'sun' ? 'Sun' : f.types[0] === 'optical' ? 'Optical' : null;
  return [colours, kinds].filter(Boolean).join(' · ');
};

/** Frames — the catalogue, for stock checks and browsing outside (or during) a visit. */
export default function FramesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Square cards, Foundry-style: 3 across in portrait, 4 in landscape (tab bar floats at the bottom).
  const numColumns = gridColumns(width - 48);
  const { activeClientId, activeClientName, mode } = useSessionStore();
  const inVisit = mode !== 'idle' && !!activeClientId;

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<Sort>(inVisit ? 'best-match' : 'newest');
  const [stock, setStock] = useState<string[]>([]);
  const [facets, setFacets] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [kind, setKind] = useState<Kind>('all');
  const { data: promo } = usePromotion();
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query.trim()); setLimit(PAGE); }, 250);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => { setSort((s) => (inVisit ? (s === 'newest' ? 'best-match' : s) : s === 'best-match' ? 'newest' : s)); }, [inVisit]);

  const params: ProductListParams = useMemo(() => ({
    q: debounced || undefined,
    stock: stock.length === 1 ? (stock[0] as 'in' | 'low' | 'out') : undefined,
    limit,
    offset: 0,
  }), [debounced, stock, limit]);
  const { data, isLoading, error, refetch, isRefetching } = useProducts(params);
  const { data: filterData } = useFilters();
  const { data: suggestions } = useSuggestions(inVisit ? activeClientId : null, { limit: 50 });

  const scores = useMemo(() => new Map((suggestions ?? []).map((s) => [s.productId, s])), [suggestions]);

  const products = useMemo(() => {
    let list = data?.data ?? [];
    // Multi-stock selections and facets are filtered here (the API takes one stock value).
    if (stock.length > 1) list = list.filter((p) => stock.includes(p.viewHints?.stockBucket ?? 'in'));
    if (kind !== 'all') list = list.filter((p) => eyewearType(p) === kind);
    const active = Object.entries(facets).filter(([, v]) => v.length);
    if (active.length && filterData?.products) {
      list = list.filter((p) => {
        const map = filterData.products[productKey(p)];
        return !!map && active.every(([g, vals]) => vals.some((v) => (map[g] ?? []).includes(v)));
      });
    }
    const sorted = [...list];
    if (sort === 'best-match') sorted.sort((a, b) => (scores.get(productKey(b))?.score ?? 0) - (scores.get(productKey(a))?.score ?? 0));
    if (sort === 'price-asc') sorted.sort((a, b) => parseFloat(a.priceMin ?? '0') - parseFloat(b.priceMin ?? '0'));
    if (sort === 'price-desc') sorted.sort((a, b) => parseFloat(b.priceMin ?? '0') - parseFloat(a.priceMin ?? '0'));
    return sorted;
  }, [data, stock, facets, filterData, sort, scores, kind]);

  // One card per family (AURA: green and tortoise, optical and sun), as on lunettiq.com.
  const families = useMemo(() => groupByFamily(products, kind === 'all' ? null : kind), [products, kind]);

  const total = data?.meta?.total ?? products.length;
  const activeFilters = stock.length + Object.values(facets).reduce((n, v) => n + v.length, 0);
  const clear = useCallback(() => { setQuery(''); setStock([]); setFacets({}); setKind('all'); }, []);

  const toggleFacet = useCallback((group: string, value: string) => {
    setFacets((f) => {
      const cur = f[group] ?? [];
      return { ...f, [group]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: FrameFamily }) => {
    // Best fit across the family's colours.
    const s = item.members.map((m) => scores.get(productKey(m))).filter(Boolean).sort((a, b) => (b!.score ?? 0) - (a!.score ?? 0))[0];
    return (
      <View style={{ width: `${100 / numColumns}%` }} className="p-[8px]">
        <ProductCard
          product={item.lead}
          name={item.name}
          subtitle={familyLine(item)}
          priceFrom={item.priceMin}
          stockStatus={item.stockBucket}
          onPress={() => router.push(`/products/${productKey(item.lead)}`)}
          fitScore={inVisit ? s?.score ?? null : null}
          fitReasons={s?.matchReasons}
        />
      </View>
    );
  }, [scores, numColumns, router, inVisit]);

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={inVisit ? `Frames for ${activeClientName?.split(' ')[0] ?? 'the client'}` : 'Frames'}
        subtitle={`${families.length} frames · ${products.length} colourways${inVisit ? ' · best matches first' : ''}`}
        meta={inVisit ? <Badge tone="success" dot>Visit open</Badge> : undefined}
        actions={<Button label="Scan" icon={ScanLine} onPress={() => router.push('/products/scanner')} />}
      />
      <View className="flex-row items-center gap-[12px] px-[32px] pt-[16px]">
        <View className="flex-1 flex-row items-center gap-[10px] border border-border rounded-md px-[12px] min-h-[44px]">
          <Search size={18} color={kitColors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, shape or colour"
            placeholderTextColor={kitColors.iconMuted}
            className="flex-1 text-body-md text-text-primary"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search frames"
          />
        </View>
        <Button label={activeFilters ? `Filters · ${activeFilters}` : 'Filters'} icon={SlidersHorizontal} variant={activeFilters ? 'primary' : 'secondary'} onPress={() => setShowFilters(true)} />
      </View>
      <View className="px-[32px] pt-[12px] flex-row items-center gap-[16px] flex-wrap">
        <FilterChips<Kind>
          value={kind}
          onChange={setKind}
          options={[{ key: 'all', label: 'All' }, { key: 'optical', label: 'Optical' }, { key: 'sun', label: 'Sun' }]}
        />
        <View className="w-[1px] h-[28px] bg-border" />
        <FilterChips<Sort>
          value={sort}
          onChange={setSort}
          options={[
            ...(inVisit ? [{ key: 'best-match' as const, label: 'Best match' }] : []),
            { key: 'newest', label: 'Newest' },
            { key: 'price-asc', label: 'Price: low to high' },
            { key: 'price-desc', label: 'Price: high to low' },
          ]}
        />
      </View>

      {promotionApplies(promo, undefined) && promo?.messages?.banner?.en ? (
        <View className="mx-[32px] mt-[12px] px-[16px] py-[10px] rounded-md border border-border bg-bg-subtle">
          <Text className="text-body-sm text-text-primary">{promo.messages.banner.en}</Text>
        </View>
      ) : null}

      {isLoading && !data ? <LoadingState /> : error && !data ? <ErrorState error={error} onRetry={refetch} /> : families.length === 0 ? (
        <EmptyState message={debounced || activeFilters || kind !== 'all' ? 'No frames match. Try fewer filters.' : 'No frames in the catalogue yet.'} actionLabel={debounced || activeFilters || kind !== 'all' ? 'Clear search and filters' : undefined} onAction={debounced || activeFilters || kind !== 'all' ? clear : undefined} />
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={families}
          keyExtractor={(f) => f.key}
          numColumns={numColumns}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => { if ((data?.data?.length ?? 0) < total) setLimit((l) => l + PAGE); }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={(data?.data?.length ?? 0) < total ? <Text className="text-body-sm text-text-tertiary text-center py-[16px]">Loading more…</Text> : null}
        />
      )}

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filterData={filterData}
        selectedFacets={facets}
        selectedStock={stock}
        onFacetToggle={toggleFacet}
        onStockToggle={(v) => setStock((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))}
        onClear={() => { setStock([]); setFacets({}); }}
        activeCount={activeFilters}
      />
    </View>
  );
}

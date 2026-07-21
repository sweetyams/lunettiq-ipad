import { View, Text, FlatList, Pressable, useWindowDimensions, RefreshControl } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ScanLine, SlidersHorizontal } from 'lucide-react-native';
import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useFilters } from '@/src/api/useFilters';
import { useClient } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { ProductCard, SearchBar, FilterPillRow, LoadingState, ErrorState, EmptyState, Button } from '@/src/ui';
import { FilterSheet } from '@/src/ui/FilterSheet';
import type { Product, ProductListParams } from '@/src/api/products.types';

// --- Sort options ---

const SORT_OPTIONS = [
  { key: 'sort-newest', label: 'Newest', value: 'newest' },
  { key: 'sort-price-asc', label: 'Price ↑', value: 'price-asc' },
  { key: 'sort-price-desc', label: 'Price ↓', value: 'price-desc' },
  { key: 'sort-best', label: 'Best match', value: 'best-match' },
];

// --- Screen ---

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const numColumns = width > 1000 ? 4 : 3;

  // Session context
  const activeClientId = useSessionStore((s) => s.activeClientId);

  // Get client name for session header
  const { data: activeClient } = useClient(activeClientId ?? '');

  // Fetch filter taxonomy from API
  const { data: filterData } = useFilters();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter state
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [offset, setOffset] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Build query params
  const queryParams: ProductListParams = useMemo(() => ({
    q: debouncedQuery || undefined,
    stock: selectedStock.length === 1 ? selectedStock[0] as 'in' | 'low' | 'out' : undefined,
    limit: 50,
    offset,
  }), [debouncedQuery, selectedStock, offset]);

  // Fetch products
  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useProducts(queryParams);

  // Fetch suggestions when session active
  const { data: suggestions } = useSuggestions(activeClientId, { limit: 50 });

  // Build score map from suggestions
  const scoreMap = useMemo(() => {
    const map = new Map<string, { score: number; reasons: string[] }>();
    if (!suggestions) return map;
    for (const s of suggestions) {
      map.set(s.productId, { score: s.score, reasons: s.matchReasons });
    }
    return map;
  }, [suggestions]);

  // Derive owned product set from suggestions (scored with negative means owned in the algorithm)
  const ownedSet = useMemo(() => {
    const set = new Set<string>();
    // Products with very low scores and no match reasons are likely owned/penalized
    // The API doesn't explicitly expose ownedProductIds, so we infer from score=0
    // This is a best-effort approach
    return set;
  }, []);

  // Process and sort products
  const products = useMemo(() => {
    const raw = productsResponse?.data ?? [];
    if (!raw.length) return [];

    // Apply faceted filters locally using the product→filter mapping
    let filtered = raw;
    const hasActiveFacets = Object.values(selectedFacets).some((v) => v.length > 0);

    if (hasActiveFacets && filterData?.products) {
      filtered = raw.filter((product) => {
        const productId = product.shopifyId ?? product.id;
        const productFilters = filterData.products[productId];
        if (!productFilters) return false; // Product not in filter map → exclude

        return Object.entries(selectedFacets).every(([groupCode, values]) => {
          if (values.length === 0) return true; // No selection in this group
          const productValues = productFilters[groupCode] ?? [];
          return values.some((v) => productValues.includes(v));
        });
      });
    }

    let sorted = [...filtered];

    if (selectedSort === 'best-match' && scoreMap.size > 0) {
      sorted.sort((a, b) => {
        const scoreA = scoreMap.get(a.id)?.score ?? 0;
        const scoreB = scoreMap.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
    } else if (selectedSort === 'price-asc') {
      sorted.sort((a, b) => (parseFloat(a.priceMin ?? '0') - parseFloat(b.priceMin ?? '0')));
    } else if (selectedSort === 'price-desc') {
      sorted.sort((a, b) => (parseFloat(b.priceMin ?? '0') - parseFloat(a.priceMin ?? '0')));
    }
    // 'newest' is the default server sort

    return sorted;
  }, [productsResponse, selectedSort, scoreMap, selectedFacets, filterData]);

  // Filter pills (combine stock + sort)
  const sortFilters = useMemo(() => {
    // Only show "Best match" when session is active
    if (activeClientId) return SORT_OPTIONS;
    return SORT_OPTIONS.filter((o) => o.value !== 'best-match');
  }, [activeClientId]);

  // Auto-switch to "Best match" when session starts
  useEffect(() => {
    if (activeClientId && selectedSort === 'newest') {
      setSelectedSort('best-match');
    }
    if (!activeClientId && selectedSort === 'best-match') {
      setSelectedSort('newest');
    }
  }, [activeClientId]);

  const handleStockToggle = useCallback((value: string) => {
    setSelectedStock((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [value]
    );
    setOffset(0);
  }, []);

  const handleSortToggle = useCallback((value: string) => {
    setSelectedSort(value);
  }, []);

  const handleFacetToggle = useCallback((groupCode: string, value: string) => {
    setSelectedFacets((prev) => {
      const current = prev[groupCode] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [groupCode]: updated };
    });
    setOffset(0);
  }, []);

  const handleProductPress = useCallback((id: string) => {
    router.push(`/products/${id}`);
  }, [router]);

  const handleLoadMore = useCallback(() => {
    const total = productsResponse?.meta?.total ?? 0;
    if (products.length < total) {
      setOffset((prev) => prev + 50);
    }
  }, [productsResponse, products.length]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedStock([]);
    setSelectedSort('newest');
    setSelectedFacets({});
    setOffset(0);
  }, []);

  // Render product card
  const renderProduct = useCallback(({ item }: { item: Product }) => {
    const scoreData = scoreMap.get(item.id);
    return (
      <View className="flex-1 p-sm">
        <ProductCard
          product={item}
          onPress={handleProductPress}
          fitScore={scoreData?.score ?? null}
          fitReasons={scoreData?.reasons}
          stockStatus={item.viewHints?.stockBucket}
          isOwned={ownedSet.has(item.id)}
        />
      </View>
    );
  }, [scoreMap, ownedSet, handleProductPress]);

  // Key extractor
  const keyExtractor = useCallback((item: Product) => item.id ?? item.shopifyId, []);

  // Stale data indicator
  const isStale = dataUpdatedAt > 0 && Date.now() - dataUpdatedAt > 10 * 60 * 1000;
  const staleLabel = isStale && dataUpdatedAt > 0
    ? `As of ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    const facetCount = Object.values(selectedFacets).reduce((sum, v) => sum + v.length, 0);
    return selectedStock.length + facetCount;
  }, [selectedStock, selectedFacets]);

  // --- Render ---

  if (isLoading && !productsResponse) return <LoadingState />;
  if (error && !productsResponse) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-md border-b border-border">
        {activeClientId && activeClient ? (
          <Text className="text-displayLg text-text-primary">
            Browsing for {activeClient.firstName ?? 'client'}
          </Text>
        ) : (
          <Text className="text-displayLg text-text-primary">Products</Text>
        )}
        {productsResponse?.meta && (
          <Text className="text-caption text-text-muted mt-xs">
            {productsResponse.meta.total} products
            {staleLabel && ` · ${staleLabel}`}
          </Text>
        )}
      </View>

      {/* Search + Filter bar — single row */}
      <View className="px-xl py-sm border-b border-border flex-row items-center gap-sm">
        <View className="flex-1">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
          />
        </View>
        {/* Scan button */}
        <Pressable
          onPress={() => router.push('/products/scanner')}
          className="w-[44px] h-[44px] items-center justify-center border border-border rounded-md bg-bg-elevated"
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
        >
          <ScanLine size={20} color="#2B2B2B" />
        </Pressable>
        {/* Filter button with active count badge */}
        <Pressable
          onPress={() => setShowFilterSheet(true)}
          className={`min-h-[44px] px-md rounded-md flex-row items-center gap-xs border ${
            activeFilterCount > 0 ? 'bg-brand border-brand' : 'border-border bg-bg-elevated'
          }`}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <SlidersHorizontal size={16} color={activeFilterCount > 0 ? '#FFFFFF' : '#2B2B2B'} />
          <Text className={`text-caption font-medium ${activeFilterCount > 0 ? 'text-white' : 'text-text-primary'}`}>
            {activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : 'Filter'}
          </Text>
        </Pressable>
      </View>

      {/* Sort pills — single row, always visible */}
      <View className="border-b border-border">
        <FilterPillRow
          filters={sortFilters}
          selected={[selectedSort]}
          onToggle={handleSortToggle}
        />
      </View>

      {/* Filter sheet */}
      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filterData={filterData}
        selectedFacets={selectedFacets}
        selectedStock={selectedStock}
        onFacetToggle={handleFacetToggle}
        onStockToggle={handleStockToggle}
        onClear={() => {
          setSelectedFacets({});
          setSelectedStock([]);
        }}
        activeCount={activeFilterCount}
      />

      {/* Grid */}
      {products.length === 0 && !isLoading ? (
        <EmptyState
          message="Nothing matches — clear filters?"
          actionLabel="Clear filters"
          onAction={handleClearFilters}
        />
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={products}
          keyExtractor={keyExtractor}
          renderItem={renderProduct}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

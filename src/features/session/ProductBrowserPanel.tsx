import { View, Text, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useFilters } from '@/src/api/useFilters';
import { ProductCard, SearchBar, FilterPillRow, LoadingState, EmptyState, Button } from '@/src/ui';
import { FilterSheet } from '@/src/ui/FilterSheet';
import type { Product, ProductListParams } from '@/src/api/products.types';

// --- Sort options ---

const SORT_OPTIONS = [
  { key: 'sort-best', label: 'Best match', value: 'best-match' },
  { key: 'sort-newest', label: 'Newest', value: 'newest' },
  { key: 'sort-price-asc', label: 'Price ↑', value: 'price-asc' },
  { key: 'sort-price-desc', label: 'Price ↓', value: 'price-desc' },
];

// --- Component ---

interface ProductBrowserPanelProps {
  clientId: string;
  clientName: string;
  onProductPress?: (productId: string) => void;
  /** External search term injected by AI Stylist chips */
  externalSearch?: string;
}

export function ProductBrowserPanel({
  clientId,
  clientName,
  onProductPress,
  externalSearch,
}: ProductBrowserPanelProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // In session context, panel is ~762pt wide → 3 columns
  const numColumns = 3;

  // Fetch filter taxonomy from API
  const { data: filterData } = useFilters();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter state
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>('best-match');
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

  // Apply external search (from AI Stylist chips)
  useEffect(() => {
    if (externalSearch !== undefined && externalSearch !== searchQuery) {
      setSearchQuery(externalSearch);
    }
  }, [externalSearch]);

  // Build query params
  const queryParams: ProductListParams = useMemo(() => ({
    q: debouncedQuery || undefined,
    stock: selectedStock.length === 1 ? selectedStock[0] as 'in' | 'low' | 'out' : undefined,
    limit: 30,
    offset,
  }), [debouncedQuery, selectedStock, offset]);

  // Fetch products
  const {
    data: productsResponse,
    isLoading,
    dataUpdatedAt,
  } = useProducts(queryParams);

  // Fetch suggestions (scored recommendations for this client)
  const { data: suggestions } = useSuggestions(clientId, { limit: 50 });

  // Build score map
  const scoreMap = useMemo(() => {
    const map = new Map<string, { score: number; reasons: string[] }>();
    if (!suggestions) return map;
    for (const s of suggestions) {
      map.set(s.productId, { score: s.score, reasons: s.matchReasons });
    }
    return map;
  }, [suggestions]);

  // Sort products
  const products = useMemo(() => {
    const raw = productsResponse?.data ?? [];
    if (!raw.length) return [];

    // Apply faceted filters locally
    let filtered = raw;
    const hasActiveFacets = Object.values(selectedFacets).some((v) => v.length > 0);

    if (hasActiveFacets && filterData?.products) {
      filtered = raw.filter((product) => {
        const productId = product.shopifyId ?? product.id;
        const productFilters = filterData.products[productId];
        if (!productFilters) return false;

        return Object.entries(selectedFacets).every(([groupCode, values]) => {
          if (values.length === 0) return true;
          const productValues = productFilters[groupCode] ?? [];
          return values.some((v) => productValues.includes(v));
        });
      });
    }

    const sorted = [...filtered];

    if (selectedSort === 'best-match' && scoreMap.size > 0) {
      sorted.sort((a, b) => {
        const scoreA = scoreMap.get(a.id)?.score ?? 0;
        const scoreB = scoreMap.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
    } else if (selectedSort === 'price-asc') {
      sorted.sort((a, b) => parseFloat(a.priceMin ?? '0') - parseFloat(b.priceMin ?? '0'));
    } else if (selectedSort === 'price-desc') {
      sorted.sort((a, b) => parseFloat(b.priceMin ?? '0') - parseFloat(a.priceMin ?? '0'));
    }

    return sorted;
  }, [productsResponse, selectedSort, scoreMap, selectedFacets, filterData]);

  // Handlers
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
    if (onProductPress) {
      onProductPress(id);
    } else {
      router.push(`/products/${id}`);
    }
  }, [router, onProductPress]);

  const handleLoadMore = useCallback(() => {
    const total = productsResponse?.meta?.total ?? 0;
    if (products.length < total) {
      setOffset((prev) => prev + 30);
    }
  }, [productsResponse, products.length]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedStock([]);
    setSelectedSort('best-match');
    setSelectedFacets({});
    setOffset(0);
  }, []);

  // Render product card
  const renderProduct = useCallback(({ item }: { item: Product }) => {
    const scoreData = scoreMap.get(item.id);
    return (
      <View className="flex-1 p-xs">
        <ProductCard
          product={item}
          onPress={handleProductPress}
          fitScore={scoreData?.score ?? null}
          fitReasons={scoreData?.reasons}
          stockStatus={item.viewHints?.stockBucket}
        />
      </View>
    );
  }, [scoreMap, handleProductPress]);

  const keyExtractor = useCallback((item: Product) => item.id ?? item.shopifyId, []);

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    const facetCount = Object.values(selectedFacets).reduce((sum, v) => sum + v.length, 0);
    return selectedStock.length + facetCount;
  }, [selectedStock, selectedFacets]);

  // Stale indicator
  const isStale = dataUpdatedAt > 0 && Date.now() - dataUpdatedAt > 10 * 60 * 1000;
  const staleLabel = isStale && dataUpdatedAt > 0
    ? `As of ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-lg pt-lg pb-sm">
        <Text className="text-displayMd text-text-primary font-bold">
          Browsing for {clientName}
        </Text>
        {productsResponse?.meta && (
          <Text className="text-caption text-text-muted mt-xs">
            {productsResponse.meta.total} products
            {staleLabel && ` · ${staleLabel}`}
          </Text>
        )}
      </View>

      {/* Search + Filter bar */}
      <View className="px-lg py-xs flex-row items-center gap-sm">
        <View className="flex-1">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search frames..."
          />
        </View>
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
            {activeFilterCount > 0 ? `${activeFilterCount}` : 'Filter'}
          </Text>
        </Pressable>
      </View>

      {/* Sort pills — single row */}
      <View className="border-b border-border">
        <FilterPillRow
          filters={SORT_OPTIONS}
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
      {isLoading && !productsResponse ? (
        <LoadingState />
      ) : products.length === 0 ? (
        <EmptyState
          message="Nothing matches — clear filters?"
          actionLabel="Clear filters"
          onAction={handleClearFilters}
        />
      ) : (
        <FlatList
          key={`session-grid-${numColumns}`}
          data={products}
          keyExtractor={keyExtractor}
          renderItem={renderProduct}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 4 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

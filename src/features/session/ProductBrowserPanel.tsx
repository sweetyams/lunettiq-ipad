import { View, Text, FlatList, useWindowDimensions } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useProducts } from '@/src/api/useProducts';
import { useSuggestions } from '@/src/api/useSuggestions';
import { ProductCard, SearchBar, FilterPillRow, LoadingState, EmptyState } from '@/src/ui';
import type { Product, ProductListParams } from '@/src/api/products.types';

// --- Filter definitions ---

const STOCK_FILTERS = [
  { key: 'stock-in', label: 'In stock', value: 'in' },
  { key: 'stock-low', label: 'Low stock', value: 'low' },
  { key: 'stock-out', label: 'Out of stock', value: 'out' },
];

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
}

export function ProductBrowserPanel({
  clientId,
  clientName,
  onProductPress,
}: ProductBrowserPanelProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // In session context, panel is ~762pt wide → 3 columns
  const numColumns = 3;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filter state
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>('best-match');
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

    const sorted = [...raw];

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
  }, [productsResponse, selectedSort, scoreMap]);

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

      {/* Search */}
      <View className="px-lg py-xs">
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search frames..."
        />
      </View>

      {/* Filters */}
      <View className="border-b border-border">
        <FilterPillRow
          filters={STOCK_FILTERS}
          selected={selectedStock}
          onToggle={handleStockToggle}
        />
        <FilterPillRow
          filters={SORT_OPTIONS}
          selected={[selectedSort]}
          onToggle={handleSortToggle}
        />
      </View>

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

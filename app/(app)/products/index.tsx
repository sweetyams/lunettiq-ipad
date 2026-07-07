import { useState, useCallback } from 'react';
import { View, FlatList, Text, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/src/api/useProducts';
import { SearchBar } from '@/src/ui/SearchBar';
import { ProductCard } from '@/src/ui/ProductCard';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';
import type { Product } from '@/src/api/products.types';

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();

  const { data: products, isLoading, error, refetch } = useProducts({
    q: search || undefined,
    limit: 50,
  });

  // 4 columns landscape, 3 portrait (iPad)
  const numColumns = width > 1024 ? 4 : 3;

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View className="flex-1 p-sm" style={{ maxWidth: `${100 / numColumns}%` }}>
        <ProductCard product={item} onPress={() => {}} />
      </View>
    ),
    [numColumns],
  );

  const keyExtractor = useCallback((item: Product) => item.shopifyId, []);

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      {/* Search + filters */}
      <View className="px-xl pt-xl pb-md">
        <Text className="text-charcoal text-displayMd font-bold mb-md">Products</Text>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search frames…"
        />
      </View>

      {/* Grid */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          error={error instanceof Error ? error.message : 'Failed to load products'}
          onRetry={refetch}
        />
      ) : !products?.length ? (
        <EmptyState
          message={search ? 'No products match your search' : 'No products in catalogue'}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          contentContainerClassName="px-lg pb-xl"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

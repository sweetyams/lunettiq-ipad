import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import { LargeTitle } from '../../components/ui/LargeTitle';
import Colors from '../../constants/Colors';
import type { Product } from '../../lib/types';

const FILTERS: { label: string; param: Record<string, string> }[] = [
  { label: 'All', param: {} },
  { label: 'Acetate', param: { material: 'acetate' } },
  { label: 'Metal', param: { material: 'metal' } },
  { label: 'Round', param: { tag: 'round' } },
  { label: 'Square', param: { tag: 'square' } },
  { label: 'Cat-eye', param: { tag: 'cat-eye' } },
];

export default function ProductsScreen() {
  const { products } = useApi();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cols = 2;
  const [data, setData] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);

  useEffect(() => {
    const f = FILTERS[activeFilter].param;
    products.list({ q: query || undefined, limit: 24, ...f } as any).then((r) => setData(Array.isArray(r) ? r : [])).catch(console.error);
  }, [query, activeFilter]);

  const cardWidth = (width - 40 - (cols - 1) * 10) / cols;

  return (
    <View style={styles.screen}>
      <LargeTitle title="Products" />
      <View style={styles.bar}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map((f, i) => (
            <Pressable key={f.label} onPress={() => setActiveFilter(i)} style={[styles.chip, i === activeFilter && styles.chipActive]}>
              <Text style={[styles.chipText, i === activeFilter && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        numColumns={cols}
        key={cols}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, { width: cardWidth }]} onPress={() => router.push(`/product/${item.id}`)}>
            {(item.imageUrl || item.images?.[0]?.src || item.images?.[0]) ? (
              <Image source={{ uri: item.imageUrl || item.images?.[0]?.src || item.images?.[0] }} style={styles.img} />
            ) : <View style={styles.img} />}
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.price}>{item.variants?.[0]?.price ? `$${item.variants[0].price}` : ''}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  bar: { paddingHorizontal: 20 },
  filters: { marginTop: 10, marginBottom: 4 },
  filtersContent: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, minHeight: 36, justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.black },
  chipText: { fontSize: 15, color: Colors.black, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  grid: { padding: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: Colors.bg },
  title: { fontSize: 15, fontWeight: '600', color: Colors.black, paddingHorizontal: 10, paddingTop: 8 },
  price: { fontSize: 15, color: Colors.muted, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  empty: { fontSize: 17, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});

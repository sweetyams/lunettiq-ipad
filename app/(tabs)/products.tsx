import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import { SectionLabel } from '../../components/ui/List';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';

const FILTERS: { label: string; key: string; value: string }[] = [
  { label: 'All', key: '', value: '' },
  { label: 'Optical', key: 'type', value: 'optical' },
  { label: 'Sun', key: 'type', value: 'sun' },
  { label: 'Acetate', key: 'material', value: 'acetate' },
  { label: 'Metal', key: 'material', value: 'metal' },
  { label: 'Titanium', key: 'material', value: 'titanium' },
  { label: 'Rx Compatible', key: 'rx', value: 'true' },
  { label: 'In Stock', key: 'tag', value: 'in-stock' },
];

export default function ProductsScreen() {
  const { products } = useApi();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const { width } = useWindowDimensions();
  const cols = width > 1000 ? 3 : 2;
  const [data, setData] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const f = FILTERS[activeFilter];
      const params: any = { limit: 24 };
      if (query) params.q = query;
      if (f.key) params[f.key] = f.value;
      products.list(params).then((r) => setData(Array.isArray(r) ? r : [])).catch(console.error);
    }, query ? 300 : 0);
  }, [query, activeFilter]);

  const cardWidth = (width - 48 - (cols - 1) * 12) / cols;

  return (
    <View style={styles.screen}>
      {/* Client context banner */}
      {clientId && (
        <View style={styles.contextBanner}>
          <Text style={styles.contextText}>Browsing for client — tap a product to recommend</Text>
          <Button title="✕ Cancel" onPress={() => router.replace('/(tabs)/products')} variant="outline" small />
        </View>
      )}
      {/* Search + Filters */}
      <View style={styles.header}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search frames…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f, i) => (
            <Pressable key={f.label} onPress={() => setActiveFilter(i)} style={[styles.chip, i === activeFilter && styles.chipActive]}>
              <Text style={[styles.chipText, i === activeFilter && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      <FlatList
        data={data}
        numColumns={cols}
        key={cols}
        keyExtractor={(p) => p.shopifyProductId}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, { width: cardWidth }]} onPress={() => router.push({ pathname: `/product/${item.shopifyProductId}` as any, params: clientId ? { clientId } : {} })}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder]} />
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <StockDot count={item.totalInventory} />
              </View>
              <Text style={styles.cardVendor}>{item.vendor || ''}</Text>
              <Text style={styles.cardPrice}>
                {item.priceMin && item.priceMax && item.priceMin !== item.priceMax
                  ? `$${item.priceMin} – $${item.priceMax}`
                  : item.priceMin ? `$${item.priceMin}` : ''}
              </Text>
              {item.variants?.length > 1 && (
                <Text style={styles.cardVariants}>{item.variants.length} colours</Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products match your search</Text>}
      />
    </View>
  );
}

function StockDot({ count }: { count: number }) {
  const color = count > 0 ? Colors.success : Colors.error;
  return (
    <View style={styles.stockRow}>
      <View style={[styles.stockDot, { backgroundColor: color }]} />
      <Text style={[styles.stockText, { color }]}>{count > 0 ? count : 'Out'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  contextBanner: { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contextText: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  header: { padding: 16, paddingBottom: 8 },
  filterRow: { marginTop: 10 },
  filterContent: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 2, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, minHeight: 34, justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.navy },
  chipTextActive: { color: Colors.white },
  grid: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, overflow: 'hidden' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: Colors.cream },
  imgPlaceholder: { backgroundColor: Colors.cream },
  cardBody: { padding: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.navy, flex: 1, marginRight: 8 },
  cardVendor: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '600', color: Colors.navy, marginTop: 4 },
  cardVariants: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11, fontWeight: '600' },
  empty: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});

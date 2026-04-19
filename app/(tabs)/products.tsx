import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import Colors from '../../constants/Colors';
import type { Product } from '../../lib/types';

const FILTERS = ['All', 'Acetate', 'Metal', 'Round', 'Square', 'Cat-eye'];

export default function ProductsScreen() {
  const { apiFetch } = useApi();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cols = width > 1000 ? 4 : 3;
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const params = query ? `?q=${encodeURIComponent(query)}&limit=24` : '?limit=24';
    apiFetch<Product[]>(`/api/crm/products${params}`).then(setProducts).catch(console.error);
  }, [query]);

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search products..." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={products}
        numColumns={cols}
        key={cols}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, { width: (width - 48) / cols - 8 }]} onPress={() => router.push(`/product/${item.id}`)}>
            {item.images[0] && <Image source={{ uri: item.images[0].src }} style={styles.img} />}
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.price}>{item.variants[0]?.price ? `$${item.variants[0].price}` : ''}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  bar: { padding: 16 },
  filters: { marginTop: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, marginRight: 8, borderWidth: 1, borderColor: Colors.border, minHeight: 44, justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  chipText: { fontSize: 15, color: Colors.navy },
  chipTextActive: { color: Colors.white },
  grid: { paddingHorizontal: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 10, marginBottom: 12, marginRight: 8, overflow: 'hidden' },
  img: { width: '100%', aspectRatio: 1, backgroundColor: Colors.border },
  title: { fontSize: 15, fontWeight: '600', color: Colors.navy, padding: 8, paddingBottom: 2 },
  price: { fontSize: 15, color: Colors.muted, paddingHorizontal: 8, paddingBottom: 8 },
});

import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import { SectionLabel } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';

export default function ClientsScreen() {
  const { clients } = useApi();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent on mount, search on type
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setLoading(true);
      clients.list({ q: query || undefined, limit: 30 })
        .then((r) => setResults(Array.isArray(r) ? r : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, query ? 250 : 0);
  }, [query]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name, email, phone…" />
        </View>
        <Button title="+ New client" onPress={() => router.push('/client/new')} small style={{ marginLeft: 12 }} />
      </View>
      <SectionLabel style={{ paddingHorizontal: 20, marginTop: 4 }}>
        {query ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'All clients'}
      </SectionLabel>
      <FlatList
        data={results}
        keyExtractor={(c) => c.shopifyCustomerId || c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/client/${item.shopifyCustomerId}`)} style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>{(item.firstName || item.email || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email}</Text>
              <Text style={styles.meta}>{item.email || ''}{item.phone ? ` · ${item.phone}` : ''}</Text>
            </View>
            {item.tier && <Badge label={item.tier} variant={item.tier === 'Tier III' ? 'tier3' : item.tier === 'Tier II' ? 'tier2' : 'tier1'} />}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading…' : 'No clients found'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 1, gap: 12, minHeight: 52 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 13, fontWeight: '700', color: Colors.navy },
  name: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  meta: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  empty: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});

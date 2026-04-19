import { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import Colors from '../../constants/Colors';
import type { Client } from '../../lib/types';

export default function ClientsScreen() {
  const { apiFetch } = useApi();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) { setClients([]); return; }
    apiFetch<Client[]>(`/api/crm/clients?q=${encodeURIComponent(q)}&limit=20`).then(setClients).catch(console.error);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <SearchBar value={query} onChangeText={search} placeholder="Search clients..." />
      </View>
      <FlatList
        data={clients}
        keyExtractor={(c) => c.shopifyCustomerId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/client/${item.shopifyCustomerId}`)}>
            <View>
              <Text style={styles.name}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            {item.tier && <Text style={styles.tier}>{item.tier}</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{query.length >= 2 ? 'No results' : 'Type to search'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  bar: { padding: 16 },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 10, marginBottom: 8, minHeight: 44 },
  name: { fontSize: 17, fontWeight: '600', color: Colors.navy },
  email: { fontSize: 15, color: Colors.muted, marginTop: 2 },
  tier: { fontSize: 14, fontWeight: '600', color: Colors.green, backgroundColor: Colors.offWhite, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  empty: { fontSize: 17, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});

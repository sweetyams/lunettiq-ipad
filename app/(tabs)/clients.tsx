import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import { Row, Separator } from '../../components/ui/List';
import { LargeTitle } from '../../components/ui/LargeTitle';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Client } from '../../lib/types';

export default function ClientsScreen() {
  const { clients } = useApi();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    clients.list({ q, limit: 20 }).then((r) => setResults(Array.isArray(r) ? r : [])).catch(console.error);
  }, []);

  return (
    <View style={styles.screen}>
      <LargeTitle title="Clients" trailing={<Button title="+ New" onPress={() => router.push('/client/new')} variant="secondary" />} />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={search} placeholder="Name, email, or phone..." />
      </View>
      <FlatList
        data={results}
        keyExtractor={(c) => c.shopifyCustomerId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <Row
            title={`${item.firstName} ${item.lastName}`}
            subtitle={item.email}
            detail={item.tier}
            onPress={() => router.push(`/client/${item.shopifyCustomerId}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{query.length >= 2 ? 'No clients found' : 'Search by name, email, or phone'}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  list: { backgroundColor: Colors.white, borderRadius: 12, marginHorizontal: 20 },
  empty: { fontSize: 17, color: Colors.muted, textAlign: 'center', padding: 40 },
});

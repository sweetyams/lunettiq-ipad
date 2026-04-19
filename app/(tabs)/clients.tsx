import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { SearchBar } from '../../components/ui/SearchBar';
import { SectionLabel } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Colors from '../../constants/Colors';

export default function ClientsScreen() {
  const { clients } = useApi();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch on mount + debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      clients.list({ q: query || undefined, limit: 50 })
        .then((r) => setResults(Array.isArray(r) ? r : []))
        .catch(console.error);
    }, query ? 300 : 0);
  }, [query]);

  // Load preview when selected
  useEffect(() => {
    if (!selected) { setPreview(null); return; }
    clients.get(selected.shopifyCustomerId).then((res: any) => {
      // API returns { client, orders, ... } or flat object
      if (res?.client) {
        setPreview({ ...res.client, orders: res.orders || [] });
      } else {
        setPreview(res);
      }
    }).catch(console.error);
  }, [selected]);

  const tierVariant = (tags: string[]) => {
    if (tags?.some((t: string) => t.includes('III') || t.includes('3'))) return 'tier3';
    if (tags?.some((t: string) => t.includes('II') || t.includes('2'))) return 'tier2';
    return 'tier1';
  };

  return (
    <View style={styles.container}>
      {/* Left: Client list (40%) */}
      <View style={styles.listPane}>
        <View style={styles.listHeader}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search by name, email, phone…" />
        </View>
        <View style={styles.listMeta}>
          <SectionLabel>{query ? `${results.length} results` : 'All clients'}</SectionLabel>
          <Pressable onPress={() => router.push('/client/new')}>
            <Text style={styles.addBtn}>+ New</Text>
          </Pressable>
        </View>
        <FlatList
          data={results}
          keyExtractor={(c) => c.shopifyCustomerId}
          renderItem={({ item }) => {
            const isSelected = selected?.shopifyCustomerId === item.shopifyCustomerId;
            return (
              <Pressable
                onPress={() => setSelected(item)}
                onLongPress={() => router.push(`/client/${item.shopifyCustomerId}`)}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={styles.rowAvatar}>
                  <Text style={styles.rowInitial}>{(item.firstName || item.email || '?')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email}</Text>
                  <Text style={styles.rowMeta}>
                    {item.email || ''}{item.orderCount ? ` · ${item.orderCount} orders` : ''}
                  </Text>
                </View>
                {item.tier && <Badge label={item.tier} variant={tierVariant(item.tags || [])} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No clients found</Text>}
        />
      </View>

      {/* Right: Preview (60%) */}
      <View style={styles.previewPane}>
        {!preview ? (
          <View style={styles.previewEmpty}>
            <Text style={styles.previewEmptyText}>Select a client to preview</Text>
          </View>
        ) : (
          <PreviewPanel client={preview} onOpen={() => router.push(`/client/${preview.shopifyCustomerId || selected?.shopifyCustomerId}`)} onSession={() => router.push(`/session/${preview.shopifyCustomerId || selected?.shopifyCustomerId}`)} />
        )}
      </View>
    </View>
  );
}

function PreviewPanel({ client, onOpen, onSession }: { client: any; onOpen: () => void; onSession: () => void }) {
  const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
  const fit = client.metafields?.fitProfile || client.metafields?.custom || {};
  const prefs = client.metafields?.preferences || {};
  const orders = client.orders || [];

  return (
    <View style={styles.preview}>
      {/* Header */}
      <View style={styles.previewHeader}>
        <View style={styles.previewAvatar}>
          <Text style={styles.previewAvatarText}>{(client.firstName || '?')[0]}{(client.lastName || '')[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewName}>{name}</Text>
          {client.tier && <Badge label={client.tier} variant="tier3" />}
          <Text style={styles.previewContact}>{client.email}{client.phone ? ` · ${client.phone}` : ''}</Text>
        </View>
      </View>

      {/* Preferences + Fit */}
      <View style={styles.previewSections}>
        <View style={styles.previewSection}>
          <SectionLabel>Preferences</SectionLabel>
          <View style={styles.tagRow}>
            {(prefs.shapes || prefs.stated || []).map((p: string) => (
              <View key={p} style={styles.prefTag}><Text style={styles.prefTagText}>{p}</Text></View>
            ))}
            {(prefs.shapes || prefs.stated || []).length === 0 && <Text style={styles.muted}>None stated</Text>}
          </View>
        </View>
        <View style={styles.previewSection}>
          <SectionLabel>Fit Profile</SectionLabel>
          <Text style={styles.fitText}>
            {fit.faceShape || fit.face_shape || '—'} · {fit.frameWidth || fit.frame_width ? `${fit.frameWidth || fit.frame_width}mm` : '—'}
          </Text>
        </View>
      </View>

      {/* Recent orders */}
      {orders.length > 0 && (
        <View style={styles.previewSection}>
          <SectionLabel>Recent Orders</SectionLabel>
          {orders.slice(0, 3).map((o: any) => (
            <View key={o.id || o.shopifyOrderId} style={styles.orderRow}>
              <Text style={styles.orderText}>{o.product || o.lineItems?.[0]?.title || 'Order'}</Text>
              <Text style={styles.muted}>{o.date || ''}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.previewActions}>
        <Button title="Open Profile" onPress={onOpen} />
        <Button title="Start Session" onPress={onSession} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  // List pane
  listPane: { width: '40%', borderRightWidth: 1, borderRightColor: Colors.border, backgroundColor: Colors.white },
  listHeader: { padding: 16, paddingBottom: 8 },
  listMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  addBtn: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  rowSelected: { backgroundColor: Colors.bg, borderLeftColor: Colors.primary },
  rowAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  rowInitial: { fontSize: 13, fontWeight: '700', color: Colors.navy },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  rowMeta: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  empty: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginTop: 40 },
  // Preview pane
  previewPane: { flex: 1, backgroundColor: Colors.bg },
  previewEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewEmptyText: { fontSize: 14, color: Colors.muted },
  preview: { flex: 1, padding: 24 },
  previewHeader: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  previewAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  previewAvatarText: { fontSize: 18, fontWeight: '700', color: Colors.navy },
  previewName: { fontSize: 20, fontWeight: '600', color: Colors.navy, marginBottom: 4 },
  previewContact: { fontSize: 12, color: Colors.muted, marginTop: 6 },
  previewSections: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  previewSection: { flex: 1, marginBottom: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prefTag: { backgroundColor: Colors.primaryLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  prefTagText: { fontSize: 11, fontWeight: '500', color: Colors.primary },
  fitText: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  muted: { fontSize: 12, color: Colors.muted },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  orderText: { fontSize: 13, fontWeight: '500', color: Colors.navy },
  previewActions: { flexDirection: 'row', gap: 10, marginTop: 'auto', paddingTop: 20 },
});

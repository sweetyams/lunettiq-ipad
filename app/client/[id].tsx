import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Image, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/List';
import Colors from '../../constants/Colors';

type Tab = 'timeline' | 'orders' | 'appointments' | 'second_sight';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients } = useApi();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('timeline');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setError(null);
    clients.get(id).then((res: any) => {
      if (res?.client) {
        setClient({
          ...res.client,
          orders: res.orders || [],
          appointments: res.appointments || [],
          derivedPreferences: res.preferences || null,
        });
        setTimeline(Array.isArray(res.timeline) ? res.timeline : []);
      } else if (res?.shopifyCustomerId || res?.firstName) {
        setClient(res);
      } else {
        setError('Could not load client');
      }
    }).catch((e) => setError(e.message));
    clients.suggestions(id, 6).then((s) => setSuggestions(Array.isArray(s) ? s : [])).catch(() => {});
  }, [id]);

  if (error) return <View style={styles.container}><Text style={{ padding: 40, color: Colors.error }}>{error}</Text></View>;
  if (!client) return null;

  const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;
  const fit = client.metafields?.fitProfile || client.metafields?.custom || {};
  const prefs = client.metafields?.preferences || {};
  const derived = client.derivedPreferences || {};

  return (
    <View style={styles.container}>
      {/* LEFT COLUMN — Identity (25%) */}
      <ScrollView style={styles.leftCol} contentContainerStyle={styles.leftContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(client.firstName || '?')[0]}{(client.lastName || '')[0]}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {client.tier && <Badge label={client.tier} variant="tier3" />}

        <View style={styles.contactBlock}>
          <Pressable onPress={() => client.email && Linking.openURL(`mailto:${client.email}`)}>
            <Text style={styles.contactText}>{client.email || '—'}</Text>
          </Pressable>
          <Pressable onPress={() => client.phone && Linking.openURL(`tel:${client.phone}`)}>
            <Text style={styles.contactText}>{client.phone || '—'}</Text>
          </Pressable>
        </View>

        <View style={styles.statsBlock}>
          <StatRow label="LTV" value={client.totalSpent ? `$${Number(client.totalSpent).toLocaleString()}` : '—'} />
          <StatRow label="Orders" value={`${client.orderCount || 0}`} />
          <StatRow label="Credits" value={client.creditBalance != null ? `$${client.creditBalance}` : '—'} />
        </View>

        <View style={styles.tagsBlock}>
          {(client.tags || []).map((t: string) => <Badge key={t} label={t} />)}
        </View>
      </ScrollView>

      {/* CENTER COLUMN — Timeline + Activity (50%) */}
      <View style={styles.centerCol}>
        <View style={styles.tabs}>
          {(['timeline', 'orders', 'appointments', 'second_sight'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t.replace('_', ' ')}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView style={styles.centerScroll} contentContainerStyle={styles.centerContent}>
          {tab === 'timeline' && (
            timeline.length === 0
              ? <Text style={styles.muted}>No activity yet.</Text>
              : timeline.map((entry: any, i: number) => (
                <View key={entry.id || i} style={styles.timelineRow}>
                  <View style={styles.timelineDotCol}>
                    <View style={styles.dot} />
                    {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineDate}>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}</Text>
                    <Text style={styles.timelineType}>{entry.type || 'Interaction'}</Text>
                    {entry.notes && <Text style={styles.muted}>{entry.notes}</Text>}
                  </View>
                </View>
              ))
          )}
          {tab === 'orders' && (
            (client.orders || []).length === 0
              ? <Text style={styles.muted}>No orders.</Text>
              : (client.orders || []).map((o: any, i: number) => (
                <Card key={o.id || i} style={styles.orderCard}>
                  <Text style={styles.orderTitle}>{o.product || o.lineItems?.[0]?.title || 'Order'}</Text>
                  <Text style={styles.muted}>{o.date || o.createdAt || ''}{o.price ? ` · ${o.price}` : ''}</Text>
                </Card>
              ))
          )}
          {tab === 'appointments' && <Text style={styles.muted}>Appointments will appear here.</Text>}
          {tab === 'second_sight' && <Text style={styles.muted}>Second Sight history will appear here.</Text>}
        </ScrollView>
      </View>

      {/* RIGHT COLUMN — Intelligence (25%) */}
      <ScrollView style={styles.rightCol} contentContainerStyle={styles.rightContent}>
        <SectionLabel>Preferences</SectionLabel>
        <Card style={styles.cardPad}>
          <Text style={styles.prefSubLabel}>Stated</Text>
          <View style={styles.tagRow}>
            {(prefs.shapes || prefs.stated || []).length > 0
              ? (prefs.shapes || prefs.stated || []).map((p: string) => <View key={p} style={styles.prefTag}><Text style={styles.prefTagText}>{p}</Text></View>)
              : <Text style={styles.muted}>None</Text>}
          </View>
          <Text style={[styles.prefSubLabel, { marginTop: 10 }]}>Avoid</Text>
          <View style={styles.tagRow}>
            {(prefs.avoid || []).length > 0
              ? (prefs.avoid || []).map((p: string) => <View key={p} style={styles.avoidTag}><Text style={styles.avoidTagText}>{p}</Text></View>)
              : <Text style={styles.muted}>None</Text>}
          </View>
          {derived.topShapes && (
            <>
              <Text style={[styles.prefSubLabel, { marginTop: 10 }]}>Derived (from purchases)</Text>
              <View style={styles.tagRow}>
                {(derived.topShapes || []).map((p: string) => <View key={p} style={styles.derivedTag}><Text style={styles.derivedTagText}>{p}</Text></View>)}
                {(derived.topMaterials || []).map((p: string) => <View key={p} style={styles.derivedTag}><Text style={styles.derivedTagText}>{p}</Text></View>)}
              </View>
            </>
          )}
        </Card>

        <SectionLabel style={{ marginTop: 20 }}>Fit Profile</SectionLabel>
        <Card style={styles.cardPad}>
          <FitRow label="Face shape" value={fit.faceShape || fit.face_shape || '—'} />
          <FitRow label="Frame width" value={fit.frameWidth || fit.frame_width ? `${fit.frameWidth || fit.frame_width}mm` : '—'} />
          <FitRow label="Bridge" value={fit.bridge ? `${fit.bridge}mm` : '—'} />
          <FitRow label="Temple" value={fit.templeLength || fit.temple ? `${fit.templeLength || fit.temple}mm` : '—'} />
        </Card>

        <SectionLabel style={{ marginTop: 20 }}>Suggestions</SectionLabel>
        <View style={styles.suggestionsGrid}>
          {suggestions.slice(0, 4).map((p: any) => (
            <Pressable key={p.id || p.shopifyProductId} onPress={() => router.push(`/product/${p.shopifyProductId || p.id}`)} style={styles.suggestionCard}>
              {p.imageUrl && <Image source={{ uri: p.imageUrl }} style={styles.suggestionImg} />}
              <Text style={styles.suggestionTitle} numberOfLines={1}>{p.title}</Text>
            </Pressable>
          ))}
          {suggestions.length === 0 && <Text style={styles.muted}>No suggestions yet.</Text>}
        </View>

        {/* Actions */}
        <View style={styles.actionsBlock}>
          <Button title="Start Try-On" onPress={() => router.push(`/session/${id}`)} variant="secondary" />
          <Button title="Log Note" onPress={() => {}} variant="outline" small />
          <Button title="Recommend" onPress={() => {}} variant="outline" small />
          <Button title="Book Appointment" onPress={() => {}} variant="outline" small />
        </View>
      </ScrollView>
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FitRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fitRow}>
      <Text style={styles.fitLabel}>{label}</Text>
      <Text style={styles.fitValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  // Left
  leftCol: { width: '25%', backgroundColor: Colors.white, borderRightWidth: 1, borderRightColor: Colors.border },
  leftContent: { padding: 20, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.navy },
  name: { fontSize: 18, fontWeight: '600', color: Colors.navy, textAlign: 'center', marginBottom: 6 },
  contactBlock: { marginTop: 16, width: '100%', gap: 4 },
  contactText: { fontSize: 12, color: Colors.primary, textAlign: 'center' },
  statsBlock: { marginTop: 20, width: '100%', gap: 6 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: Colors.muted },
  statValue: { fontSize: 12, fontWeight: '600', color: Colors.navy },
  tagsBlock: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  // Center
  centerCol: { width: '50%', borderRightWidth: 1, borderRightColor: Colors.border },
  tabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, color: Colors.muted, textTransform: 'capitalize', fontWeight: '500' },
  tabTextActive: { color: Colors.navy, fontWeight: '600' },
  centerScroll: { flex: 1 },
  centerContent: { padding: 20 },
  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  timelineDotCol: { alignItems: 'center', width: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.navy, marginTop: 4 },
  timelineLine: { width: 1, flex: 1, backgroundColor: Colors.border, marginTop: 4 },
  timelineBody: { flex: 1, paddingBottom: 16 },
  timelineDate: { fontSize: 11, color: Colors.muted, marginBottom: 2 },
  timelineType: { fontSize: 13, fontWeight: '600', color: Colors.navy },
  // Orders
  orderCard: { padding: 12, marginBottom: 8 },
  orderTitle: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  // Right
  rightCol: { width: '25%', backgroundColor: Colors.bg },
  rightContent: { padding: 16 },
  cardPad: { padding: 14 },
  prefSubLabel: { fontSize: 11, color: Colors.muted, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prefTag: { backgroundColor: Colors.primaryLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  prefTagText: { fontSize: 11, fontWeight: '500', color: Colors.primary },
  avoidTag: { backgroundColor: Colors.errorLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  avoidTagText: { fontSize: 11, fontWeight: '500', color: Colors.error },
  derivedTag: { backgroundColor: Colors.goldLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  derivedTagText: { fontSize: 11, fontWeight: '500', color: Colors.gold },
  fitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fitLabel: { fontSize: 12, color: Colors.muted },
  fitValue: { fontSize: 12, fontWeight: '600', color: Colors.navy },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionCard: { width: '47%', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  suggestionImg: { width: '100%', aspectRatio: 1, backgroundColor: Colors.cream },
  suggestionTitle: { fontSize: 11, fontWeight: '500', color: Colors.navy, padding: 6 },
  actionsBlock: { marginTop: 20, gap: 8 },
  muted: { fontSize: 12, color: Colors.muted },
});

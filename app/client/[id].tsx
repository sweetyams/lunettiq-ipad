import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/List';
import Colors from '../../constants/Colors';

type Tab = 'overview' | 'orders' | 'timeline';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients } = useApi();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!id) return;
    clients.get(id).then(setClient).catch(console.error);
    clients.timeline(id).then((t) => setTimeline(Array.isArray(t) ? t : [])).catch(console.error);
  }, [id]);

  if (!client) return null;

  const fit = client.metafields?.fitProfile || client.metafields?.custom || {};
  const prefs = client.metafields?.preferences || {};
  const orders = client.orders || [];
  const wishlist = client.wishlist || [];
  const name = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email;

  return (
    <View style={styles.container}>
      {/* Main content */}
      <ScrollView style={styles.main}>
        {/* Identity band */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(client.firstName || '?')[0]}{(client.lastName || '')[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {client.tier && <Badge label={client.tier} variant="tier3" />}
            </View>
            <Text style={styles.contactLine}>
              {client.email || ''}{client.phone ? ` · ${client.phone}` : ''}
            </Text>
            <View style={styles.stats}>
              {client.creditBalance != null && <Stat label="Credits" value={`$${client.creditBalance}`} />}
              {client.totalSpent != null && <Stat label="LTV" value={`$${Number(client.totalSpent).toLocaleString()}`} />}
              {client.orderCount != null && <Stat label="Orders" value={`${client.orderCount}`} />}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['overview', 'orders', 'timeline'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {tab === 'overview' && (
            <View style={styles.overviewGrid}>
              {/* Fit Profile */}
              <View style={styles.gridItem}>
                <SectionLabel>Fit Profile</SectionLabel>
                <Card style={styles.cardPad}>
                  <View style={styles.fitGrid}>
                    <FitField label="Face shape" value={fit.faceShape || fit.face_shape || '—'} />
                    <FitField label="Frame width" value={fit.frameWidth || fit.frame_width ? `${fit.frameWidth || fit.frame_width}mm` : '—'} />
                    <FitField label="Bridge" value={fit.bridge ? `${fit.bridge}mm` : '—'} />
                    <FitField label="Temple" value={fit.templeLength || fit.temple ? `${fit.templeLength || fit.temple}mm` : '—'} />
                  </View>
                </Card>
              </View>

              {/* Preferences */}
              <View style={styles.gridItem}>
                <SectionLabel>Preferences</SectionLabel>
                <Card style={styles.cardPad}>
                  <Text style={styles.prefLabel}>Preferred</Text>
                  <View style={styles.tagRow}>
                    {(prefs.shapes || prefs.stated || []).length > 0
                      ? (prefs.shapes || prefs.stated || []).map((p: string) => <View key={p} style={styles.prefTag}><Text style={styles.prefTagText}>{p}</Text></View>)
                      : <Text style={styles.mutedSmall}>None stated</Text>}
                  </View>
                  <Text style={[styles.prefLabel, { marginTop: 12 }]}>Avoid</Text>
                  <View style={styles.tagRow}>
                    {(prefs.avoid || []).length > 0
                      ? (prefs.avoid || []).map((p: string) => <View key={p} style={styles.avoidTag}><Text style={styles.avoidTagText}>{p}</Text></View>)
                      : <Text style={styles.mutedSmall}>None stated</Text>}
                  </View>
                </Card>
              </View>

              {/* Wishlist */}
              {wishlist.length > 0 && (
                <View style={{ width: '100%' }}>
                  <SectionLabel>Wishlist</SectionLabel>
                  <View style={styles.wishlistRow}>
                    {wishlist.map((item: string) => (
                      <Card key={item} style={styles.wishlistCard}>
                        <Text style={styles.wishlistText}>{item}</Text>
                      </Card>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {tab === 'orders' && (
            <View>
              {orders.length === 0 && <Text style={styles.mutedSmall}>No orders yet.</Text>}
              {orders.map((order: any) => (
                <Card key={order.id || order.shopifyOrderId} style={styles.orderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderProduct}>{order.product || order.lineItems?.[0]?.title || 'Order'}</Text>
                    <Text style={styles.mutedSmall}>{order.date || order.createdAt || ''}{order.id ? ` · ${order.id}` : ''}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{order.price || order.totalPrice || ''}</Text>
                </Card>
              ))}
            </View>
          )}

          {tab === 'timeline' && (
            <View>
              {timeline.length === 0 && <Text style={styles.mutedSmall}>No activity yet.</Text>}
              {timeline.map((entry: any, i: number) => (
                <View key={entry.id || i} style={styles.timelineRow}>
                  <View style={styles.timelineDot}>
                    <View style={styles.dot} />
                    {i < timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}</Text>
                    <Text style={styles.timelineType}>{entry.type || 'Interaction'}</Text>
                    {entry.notes && <Text style={styles.mutedSmall}>{entry.notes}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Right action sidebar */}
      <View style={styles.sidebar}>
        <Button title="Start session" onPress={() => router.push(`/session/${id}`)} variant="secondary" />
        <ActionItem label="Book appointment" onPress={() => {}} />
        <ActionItem label="Second Sight intake" onPress={() => router.push({ pathname: '/second-sight/new', params: { clientId: id } })} />
        <ActionItem label="Custom design" onPress={() => router.push({ pathname: '/custom-design/new', params: { clientId: id } })} />
        <ActionItem label="Add note" onPress={() => {}} />
        <ActionItem label="Recommend product" onPress={() => {}} />

        <View style={styles.sidebarFooter}>
          {client.email && <ActionItem label={`Email: ${client.email}`} onPress={() => Linking.openURL(`mailto:${client.email}`)} />}
          {client.phone && <ActionItem label={`Call: ${client.phone}`} onPress={() => Linking.openURL(`tel:${client.phone}`)} />}
        </View>

        {(client.tags || []).length > 0 && (
          <View style={styles.tagsFooter}>
            {client.tags.map((t: string) => <Badge key={t} label={t} />)}
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label} </Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FitField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fitField}>
      <Text style={styles.fitLabel}>{label}</Text>
      <Text style={styles.fitValue}>{value}</Text>
    </View>
  );
}

function ActionItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.actionItem}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  main: { flex: 1 },
  // Identity
  identity: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, padding: 20, flexDirection: 'row', gap: 18 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.navy },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '600', color: Colors.navy },
  contactLine: { fontSize: 12, color: Colors.muted },
  stats: { flexDirection: 'row', gap: 12, marginTop: 8 },
  stat: { backgroundColor: Colors.bg, borderRadius: 2, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row' },
  statLabel: { fontSize: 12, color: Colors.muted },
  statValue: { fontSize: 12, fontWeight: '600', color: Colors.navy },
  // Tabs
  tabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', paddingHorizontal: 24 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.muted, textTransform: 'capitalize' },
  tabTextActive: { color: Colors.navy, fontWeight: '600' },
  tabContent: { padding: 20 },
  // Overview
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  gridItem: { flex: 1, minWidth: 220 },
  cardPad: { padding: 14 },
  fitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fitField: { width: '45%' },
  fitLabel: { fontSize: 11, color: Colors.muted, marginBottom: 2 },
  fitValue: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  prefLabel: { fontSize: 11, color: Colors.muted, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prefTag: { backgroundColor: Colors.primaryLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  prefTagText: { fontSize: 11, fontWeight: '500', color: Colors.primary },
  avoidTag: { backgroundColor: Colors.errorLight, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  avoidTagText: { fontSize: 11, fontWeight: '500', color: Colors.error },
  mutedSmall: { fontSize: 12, color: Colors.muted },
  // Wishlist
  wishlistRow: { flexDirection: 'row', gap: 10 },
  wishlistCard: { padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  wishlistText: { fontSize: 13, fontWeight: '500', color: Colors.navy },
  // Orders
  orderProduct: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  orderPrice: { fontSize: 15, fontWeight: '600', color: Colors.navy },
  orderCard: { padding: 14, marginBottom: 10 },
  // Timeline
  timelineRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  timelineDot: { alignItems: 'center', width: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.navy, marginTop: 3 },
  timelineLine: { width: 1, flex: 1, backgroundColor: Colors.border, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineDate: { fontSize: 11, color: Colors.muted, marginBottom: 2 },
  timelineType: { fontSize: 13, fontWeight: '600', color: Colors.navy },
  // Sidebar
  sidebar: { width: 180, backgroundColor: Colors.white, borderLeftWidth: 1, borderLeftColor: Colors.border, padding: 14, gap: 8 },
  actionItem: { borderWidth: 1, borderColor: Colors.border, borderRadius: 2, padding: 10, minHeight: 40, justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '500', color: Colors.navy },
  sidebarFooter: { marginTop: 'auto', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  tagsFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
});

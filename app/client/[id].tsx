import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Image, TextInput, StyleSheet, Linking } from 'react-native';
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
        <EditablePreferences id={id!} prefs={prefs} derived={derived} clients={clients} />
        <EditableFitProfile id={id!} fit={fit} clients={clients} />

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

const SHAPE_OPTIONS = ['Round', 'Square', 'Aviator', 'Cat-eye', 'Rectangular', 'Oval', 'Browline', 'Geometric'];
const MATERIAL_OPTIONS = ['Acetate', 'Metal', 'Titanium', 'Wood', 'Horn', 'Mixed'];
const COLOUR_OPTIONS = ['Black', 'Tortoise', 'Gold', 'Silver', 'Clear', 'Blue', 'Red', 'Green', 'Pink', 'White'];

function EditablePreferences({ id, prefs, derived, clients: api }: { id: string; prefs: any; derived: any; clients: any }) {
  const [editing, setEditing] = useState(false);
  const [shapes, setShapes] = useState<string[]>(prefs.shapes || []);
  const [materials, setMaterials] = useState<string[]>(prefs.materials || []);
  const [colours, setColours] = useState<string[]>(prefs.colours || []);
  const [avoid, setAvoid] = useState<string[]>(prefs.avoid || []);

  const save = async () => {
    const value = JSON.stringify({ shapes, materials, colours, avoid });
    await api.update(id, { metafields: { preferences_json: { value, type: 'json' } } });
    setEditing(false);
  };

  return (
    <>
      <View style={styles.sectionHeader}>
        <SectionLabel>Preferences</SectionLabel>
        <Pressable onPress={() => editing ? save() : setEditing(true)}>
          <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>
      <Card style={styles.cardPad}>
        {editing ? (
          <View style={{ gap: 12 }}>
            <ChipSelect label="Shapes" options={SHAPE_OPTIONS} selected={shapes} onChange={setShapes} />
            <ChipSelect label="Materials" options={MATERIAL_OPTIONS} selected={materials} onChange={setMaterials} />
            <ChipSelect label="Colours" options={COLOUR_OPTIONS} selected={colours} onChange={setColours} />
            <ChipSelect label="Avoid" options={[...SHAPE_OPTIONS, ...MATERIAL_OPTIONS]} selected={avoid} onChange={setAvoid} variant="avoid" />
            <Pressable onPress={() => setEditing(false)}><Text style={styles.muted}>Cancel</Text></Pressable>
          </View>
        ) : (
          <>
            <TagDisplay label="Shapes" items={shapes} />
            <TagDisplay label="Materials" items={materials} />
            <TagDisplay label="Colours" items={colours} />
            {avoid.length > 0 && <TagDisplay label="Avoid" items={avoid} variant="avoid" />}
            {derived?.topShapes && (
              <>
                <Text style={[styles.prefSubLabel, { marginTop: 10 }]}>Derived</Text>
                <View style={styles.tagRow}>
                  {(derived.topShapes || []).map((p: string) => <View key={p} style={styles.derivedTag}><Text style={styles.derivedTagText}>{p}</Text></View>)}
                  {(derived.topMaterials || []).map((p: string) => <View key={p} style={styles.derivedTag}><Text style={styles.derivedTagText}>{p}</Text></View>)}
                </View>
              </>
            )}
          </>
        )}
      </Card>
    </>
  );
}

function ChipSelect({ label, options, selected, onChange, variant }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; variant?: string }) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  return (
    <View>
      <Text style={styles.prefSubLabel}>{label}</Text>
      <View style={styles.chipGrid}>
        {options.map(o => {
          const active = selected.includes(o);
          return (
            <Pressable key={o} onPress={() => toggle(o)} style={[styles.chipTag, active && (variant === 'avoid' ? styles.chipAvoidActive : styles.chipActive)]}>
              <Text style={[styles.chipTagText, active && styles.chipTagTextActive]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TagDisplay({ label, items, variant }: { label: string; items: string[]; variant?: string }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.prefSubLabel}>{label}</Text>
      <View style={styles.tagRow}>
        {items.map(p => (
          <View key={p} style={variant === 'avoid' ? styles.avoidTag : styles.prefTag}>
            <Text style={variant === 'avoid' ? styles.avoidTagText : styles.prefTagText}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EditableFitProfile({ id, fit, clients: api }: { id: string; fit: any; clients: any }) {
  const [editing, setEditing] = useState(false);
  const [faceShape, setFaceShape] = useState(fit.faceShape || fit.face_shape || '');
  const [frameWidth, setFrameWidth] = useState(String(fit.frameWidth || fit.frame_width || ''));
  const [bridge, setBridge] = useState(String(fit.bridge || ''));
  const [temple, setTemple] = useState(String(fit.templeLength || fit.temple || ''));

  const save = async () => {
    const value = JSON.stringify({ face_shape: faceShape, frame_width: frameWidth, bridge, temple });
    await api.update(id, { metafields: { fit_profile: { value, type: 'json' } } });
    setEditing(false);
  };

  return (
    <>
      <View style={[styles.sectionHeader, { marginTop: 20 }]}>
        <SectionLabel>Fit Profile</SectionLabel>
        <Pressable onPress={() => editing ? save() : setEditing(true)}>
          <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>
      <Card style={styles.cardPad}>
        {editing ? (
          <View style={{ gap: 8 }}>
            <EditField label="Face shape" value={faceShape} onChangeText={setFaceShape} />
            <EditField label="Frame width (mm)" value={frameWidth} onChangeText={setFrameWidth} keyboardType="numeric" />
            <EditField label="Bridge (mm)" value={bridge} onChangeText={setBridge} keyboardType="numeric" />
            <EditField label="Temple (mm)" value={temple} onChangeText={setTemple} keyboardType="numeric" />
          </View>
        ) : (
          <>
            <FitRow label="Face shape" value={faceShape || '—'} />
            <FitRow label="Frame width" value={frameWidth ? `${frameWidth}mm` : '—'} />
            <FitRow label="Bridge" value={bridge ? `${bridge}mm` : '—'} />
            <FitRow label="Temple" value={temple ? `${temple}mm` : '—'} />
          </>
        )}
      </Card>
    </>
  );
}

function EditField({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: string }) {
  return (
    <View style={styles.editFieldRow}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <TextInput style={styles.editFieldInput} value={value} onChangeText={onChangeText} keyboardType={keyboardType as any} placeholderTextColor={Colors.muted} />
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editBtn: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  editInput: { fontSize: 13, color: Colors.navy, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, padding: 8, marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2, backgroundColor: Colors.cream, minHeight: 28, justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.navy },
  chipAvoidActive: { backgroundColor: Colors.error },
  chipTagText: { fontSize: 12, color: Colors.navy },
  chipTagTextActive: { color: Colors.white },
  editFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editFieldLabel: { fontSize: 12, color: Colors.muted, width: 100 },
  editFieldInput: { flex: 1, fontSize: 13, color: Colors.navy, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, padding: 6 },
});

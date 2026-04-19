import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { useAppStore } from '../../lib/store';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Client, Product } from '../../lib/types';

const OUTCOMES = ['purchased', 'shortlist_emailed', 'second_visit_booked', 'left_empty'] as const;

export default function SessionScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { clients, products } = useApi();
  const router = useRouter();
  const { setSession } = useAppStore();
  const [client, setClient] = useState<Client | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    clients.get(clientId).then(setClient).catch(console.error);
    clients.suggestions(clientId).then(setSuggestions).catch(console.error);
    // Create try-on session
    clients.createTryOn(clientId, { mode: 'session', startedAt: new Date().toISOString() })
      .then((s) => setSessionId(s.id))
      .catch(console.error);
  }, [clientId]);

  const endSession = (outcome: string) => {
    Alert.alert('End Session', `Mark as "${outcome.replace('_', ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End', style: 'destructive', onPress: async () => {
          // Log session outcome
          await clients.addTimeline(clientId!, {
            type: 'session_end',
            notes: notes || undefined,
            sessionId,
            outcome,
          }).catch(console.error);

          // Trigger summary email
          await clients.addTimeline(clientId!, {
            type: 'session_summary_email',
            sessionId,
            outcome,
            sendEmail: true,
          }).catch(console.error);

          setSession(null);
          router.back();
        },
      },
    ]);
  };

  if (!client) return null;

  const fit = client.metafields?.fitProfile;
  const prefs = client.metafields?.preferences;

  return (
    <View style={styles.container}>
      {/* Left: Main workspace */}
      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        <View style={styles.topBar}>
          <Text style={styles.title}>Session</Text>
          <Button title="Start Fitting" onPress={() => router.push({ pathname: '/session/fitting', params: { clientId, sessionId: sessionId || '' } })} variant="secondary" />
        </View>

        <Section title="Recommended">
          {suggestions.slice(0, 6).map((p, i) => (
            <View key={p.id}>
              {i > 0 && <Separator />}
              <Row title={p.title} subtitle={p.vendor} detail={p.variants[0]?.price ? `$${p.variants[0].price}` : ''} onPress={() => router.push(`/product/${p.id}`)} />
            </View>
          ))}
          {suggestions.length === 0 && <Row title="No suggestions yet" accessory="none" />}
        </Section>

        <Section title="Session Notes">
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this session..."
            placeholderTextColor={Colors.muted}
            multiline
          />
        </Section>

        <Section title="End Session">
          {OUTCOMES.map((o, i) => (
            <View key={o}>
              {i > 0 && <Separator />}
              <Row title={o.replace(/_/g, ' ')} icon={o === 'purchased' ? 'shopping-cart' : o === 'left_empty' ? 'sign-out' : 'bookmark'} onPress={() => endSession(o)} />
            </View>
          ))}
        </Section>
      </ScrollView>

      {/* Right: Client context panel */}
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <View style={styles.panelHeader}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{client.firstName[0]}{client.lastName[0]}</Text>
          </View>
          <Text style={styles.panelName}>{client.firstName} {client.lastName}</Text>
          {client.tier && <Badge label={client.tier} variant="success" />}
        </View>

        {fit && (
          <Section title="Fit">
            {fit.faceShape && <Row title="Face" detail={fit.faceShape} accessory="none" />}
            {fit.frameWidth && <><Separator /><Row title="Width" detail={`${fit.frameWidth}mm`} accessory="none" /></>}
          </Section>
        )}

        {prefs && (
          <Section title="Preferences">
            {prefs.shapes?.length ? <Row title="Shapes" detail={prefs.shapes.join(', ')} accessory="none" /> : null}
            {prefs.materials?.length ? <><Separator /><Row title="Materials" detail={prefs.materials.join(', ')} accessory="none" /></> : null}
          </Section>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg },
  main: { flex: 3 },
  mainContent: { paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.black },
  panel: { flex: 2, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.border, backgroundColor: Colors.bg },
  panelContent: { paddingBottom: 40 },
  panelHeader: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  initials: { fontSize: 22, fontWeight: '700', color: Colors.white },
  panelName: { fontSize: 20, fontWeight: '700', color: Colors.black, marginBottom: 6 },
  notesInput: { fontSize: 17, color: Colors.black, padding: 16, minHeight: 100, textAlignVertical: 'top' },
});

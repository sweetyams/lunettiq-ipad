import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Client } from '../../lib/types';

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients } = useApi();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    clients.get(id).then(setClient).catch(console.error);
    clients.timeline(id).then(setTimeline).catch(console.error);
  }, [id]);

  if (!client) return null;

  const fit = client.metafields?.fitProfile;
  const prefs = client.metafields?.preferences;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Identity */}
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{client.firstName[0]}{client.lastName[0]}</Text>
        </View>
        <Text style={styles.name}>{client.firstName} {client.lastName}</Text>
        <View style={styles.badges}>
          {client.tier && <Badge label={client.tier} variant="success" />}
          {client.tags?.slice(0, 3).map((t) => <Badge key={t} label={t} />)}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Start Session" onPress={() => router.push(`/session/${id}`)} />
        <Button title="Second Sight" onPress={() => router.push({ pathname: '/second-sight/new', params: { clientId: id } })} variant="secondary" />
      </View>

      {/* Contact */}
      <Section title="Contact">
        <Row title="Email" detail={client.email} icon="envelope" accessory="none" />
        <Separator />
        <Row title="Phone" detail={client.phone || '—'} icon="phone" accessory="none" />
      </Section>

      {/* Fit Profile */}
      {fit && (
        <Section title="Fit Profile">
          {fit.faceShape && <><Row title="Face Shape" detail={fit.faceShape} accessory="none" /><Separator /></>}
          {fit.frameWidth && <><Row title="Frame Width" detail={`${fit.frameWidth}mm`} accessory="none" /><Separator /></>}
          {fit.bridge && <><Row title="Bridge" detail={`${fit.bridge}mm`} accessory="none" /><Separator /></>}
          {fit.templeLength && <Row title="Temple" detail={`${fit.templeLength}mm`} accessory="none" />}
        </Section>
      )}

      {/* Preferences */}
      {prefs && (
        <Section title="Preferences">
          {prefs.shapes?.length ? <><Row title="Shapes" detail={prefs.shapes.join(', ')} accessory="none" /><Separator /></> : null}
          {prefs.materials?.length ? <><Row title="Materials" detail={prefs.materials.join(', ')} accessory="none" /><Separator /></> : null}
          {prefs.colors?.length ? <><Row title="Colors" detail={prefs.colors.join(', ')} accessory="none" /><Separator /></> : null}
          {prefs.avoid?.length ? <Row title="Avoid" detail={prefs.avoid.join(', ')} accessory="none" /> : null}
        </Section>
      )}

      {/* Timeline */}
      <Section title="Recent Activity">
        {timeline.length === 0 && <Row title="No activity yet" accessory="none" />}
        {timeline.slice(0, 10).map((entry, i) => (
          <View key={entry.id || i}>
            {i > 0 && <Separator />}
            <Row title={entry.type || 'Interaction'} subtitle={entry.notes || entry.summary} detail={new Date(entry.createdAt).toLocaleDateString()} accessory="none" />
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  identity: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  initials: { fontSize: 28, fontWeight: '700', color: Colors.white },
  name: { fontSize: 28, fontWeight: '700', color: Colors.black },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
});

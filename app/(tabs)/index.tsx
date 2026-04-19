import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Colors from '../../constants/Colors';
import type { Appointment, Client } from '../../lib/types';

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <Text style={styles.loading}>Loading...</Text>;
  if (!isSignedIn) return <SignIn />;
  return <HomeContent />;
}

function SignIn() {
  const { startSSOFlow } = useSSO();
  const onGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      if (createdSessionId && setActive) await setActive({ session: createdSessionId });
    } catch (e: any) { console.error(e.errors?.[0]?.message || e); }
  }, []);
  return (
    <View style={styles.center}>
      <Text style={styles.brand}>Lunettiq</Text>
      <Button title="Sign in with Google" onPress={onGoogle} />
    </View>
  );
}

function HomeContent() {
  const { apiFetch } = useApi();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    apiFetch<Appointment[]>(`/api/crm/appointments?date=${today}`).then(setAppointments).catch(console.error);
    apiFetch<Client[]>('/api/crm/clients?limit=5&sort=updatedAt&dir=desc').then(setRecentClients).catch(console.error);
  }, []);

  const next = appointments.find((a) => a.status === 'scheduled' || a.status === 'confirmed');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={styles.mb}>
        <Text style={styles.h2}>Today's Appointments</Text>
        <Text style={styles.big}>{appointments.length}</Text>
        {next && <Text style={styles.sub}>{next.startTime} — {next.clientName || 'Client'} ({next.type})</Text>}
      </Card>

      <Text style={styles.h2}>Quick Actions</Text>
      <View style={styles.actions}>
        <Button title="Search Client" onPress={() => router.push('/(tabs)/clients')} style={styles.actionBtn} />
        <Button title="New Client" onPress={() => router.push('/client/new')} variant="secondary" style={styles.actionBtn} />
        <Button title="Browse Products" onPress={() => router.push('/(tabs)/products')} variant="outline" style={styles.actionBtn} />
        <Button title="Second Sight" onPress={() => router.push('/second-sight/new')} variant="outline" style={styles.actionBtn} />
      </View>

      <Text style={[styles.h2, styles.mt]}>Recent Clients</Text>
      {recentClients.map((c) => (
        <Card key={c.shopifyCustomerId} style={styles.mb}>
          <Text style={styles.body} onPress={() => router.push(`/client/${c.shopifyCustomerId}`)}>{c.firstName} {c.lastName}</Text>
          <Text style={styles.sub}>{c.email}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.offWhite },
  brand: { fontSize: 32, fontWeight: '700', color: Colors.navy, marginBottom: 24 },
  loading: { padding: 32, fontSize: 17, color: Colors.muted },
  h2: { fontSize: 22, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  big: { fontSize: 48, fontWeight: '700', color: Colors.green },
  sub: { fontSize: 15, color: Colors.muted, marginTop: 4 },
  body: { fontSize: 17, color: Colors.navy, fontWeight: '600' },
  mb: { marginBottom: 12 },
  mt: { marginTop: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { minWidth: 160 },
});

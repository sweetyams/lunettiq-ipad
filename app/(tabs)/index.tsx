import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { LargeTitle } from '../../components/ui/LargeTitle';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import Colors from '../../constants/Colors';
import type { Appointment, Client } from '../../lib/types';

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
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
      <Text style={styles.tagline}>iPad for your store</Text>
      <Button title="Sign in with Google" onPress={onGoogle} style={{ marginTop: 32 }} />
    </View>
  );
}

function HomeContent() {
  const { clients, appointments } = useApi();
  const router = useRouter();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [recent, setRecent] = useState<Client[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    appointments.list({ date: today }).then((r) => setAppts(Array.isArray(r) ? r : [])).catch(console.error);
    clients.list({ limit: 5 }).then((r) => setRecent(Array.isArray(r) ? r : [])).catch(console.error);
  }, []);

  const next = appts.find((a) => a.status === 'scheduled' || a.status === 'confirmed');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LargeTitle title="Today" subtitle={`${appts.length} appointment${appts.length !== 1 ? 's' : ''}`} />

      {next && (
        <Section title="Next Up">
          <Row
            title={next.clientName || next.client?.firstName ? `${next.client?.firstName || ''} ${next.client?.lastName || ''}`.trim() : 'Client'}
            subtitle={`${next.startTime || ''} · ${next.type || 'appointment'}`}
            icon="calendar"
            onPress={() => router.push(`/appointment/${next.id}`)}
          />
        </Section>
      )}

      <Section title="Quick Actions">
        <Row title="Search Client" icon="search" onPress={() => router.push('/(tabs)/clients')} />
        <Separator />
        <Row title="New Client" icon="user-plus" onPress={() => router.push('/client/new')} />
        <Separator />
        <Row title="Browse Products" icon="shopping-bag" onPress={() => router.push('/(tabs)/products')} />
        <Separator />
        <Row title="Start Second Sight" icon="refresh" onPress={() => router.push('/second-sight/new')} />
      </Section>

      <Section title="Recent Clients">
        {recent.map((c, i) => (
          <View key={c.shopifyCustomerId || i}>
            {i > 0 && <Separator />}
            <Row
              title={`${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Unknown'}
              subtitle={c.email || ''}
              detail={c.tier}
              onPress={() => router.push(`/client/${c.shopifyCustomerId}`)}
            />
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  brand: { fontSize: 40, fontWeight: '700', color: Colors.black, letterSpacing: -1 },
  tagline: { fontSize: 17, color: Colors.muted, marginTop: 4 },
});

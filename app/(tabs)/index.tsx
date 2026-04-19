import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { useAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SectionLabel } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import Colors from '../../constants/Colors';

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
      <Text style={{ fontSize: 28, fontWeight: '300', color: Colors.navy, letterSpacing: -0.5 }}>Lunettiq</Text>
      <Button title="Sign in with Google" onPress={onGoogle} style={{ marginTop: 32 }} />
    </View>
  );
}

function HomeContent() {
  const { clients, appointments } = useApi();
  const router = useRouter();
  const [appts, setAppts] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    appointments.list({} as any).then((r: any) => setAppts(Array.isArray(r) ? r : [])).catch(console.error);
    clients.list({ limit: 4 }).then((r: any) => setRecent(Array.isArray(r) ? r : [])).catch(console.error);
  }, []);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    'in_progress': { bg: Colors.primaryLight, text: Colors.primary, label: 'In progress' },
    'confirmed': { bg: '#EEF2FF', text: Colors.navy, label: 'Confirmed' },
    'scheduled': { bg: Colors.cream, text: Colors.muted, label: 'Scheduled' },
    'completed': { bg: Colors.cream, text: Colors.muted, label: 'Completed' },
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.columns}>
        {/* Left column */}
        <View style={styles.left}>
          <Text style={styles.greeting}>Good morning.</Text>
          <Text style={styles.summary}>{appts.length} appointment{appts.length !== 1 ? 's' : ''} today</Text>

          <SectionLabel style={{ marginTop: 22 }}>Today's Appointments</SectionLabel>
          {appts.map((apt: any) => {
            const sc = statusColors[apt.status] || statusColors.scheduled;
            const time = apt.startsAt ? new Date(apt.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
            return (
              <Card key={apt.id} style={styles.aptCard}>
                <Pressable onPress={() => router.push(`/appointment/${apt.id}`)} style={styles.aptRow}>
                  <View style={styles.aptTime}>
                    <Text style={styles.aptTimeText}>{time}</Text>
                    <Text style={styles.aptDuration}>{apt.duration || '60 min'}</Text>
                  </View>
                  <View style={styles.aptDivider} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aptName}>{apt.customerName || 'Walk-in slot'}</Text>
                    <Text style={styles.aptType}>{apt.type || 'Appointment'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                  {apt.customerName && (
                    <Button
                      title={apt.status === 'in_progress' ? 'Resume' : 'Check in'}
                      onPress={() => apt.status === 'in_progress' ? router.push(`/session/${apt.shopifyCustomerId}`) : router.push(`/appointment/${apt.id}`)}
                      variant={apt.status === 'in_progress' ? 'secondary' : 'primary'}
                      small
                    />
                  )}
                </Pressable>
              </Card>
            );
          })}
          {appts.length === 0 && <Text style={styles.empty}>No appointments today</Text>}
        </View>

        {/* Right column */}
        <View style={styles.right}>
          <SectionLabel>Quick Actions</SectionLabel>
          {[
            { label: 'Search client', icon: 'search', route: '/(tabs)/clients' },
            { label: 'New client', icon: 'user-plus', route: '/client/new' },
            { label: 'Browse products', icon: 'th-large', route: '/(tabs)/products' },
            { label: 'Start Second Sight', icon: 'eye', route: '/second-sight/new' },
          ].map((a) => (
            <Pressable key={a.label} onPress={() => router.push(a.route as any)} style={styles.actionBtn}>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}

          <SectionLabel style={{ marginTop: 22 }}>Recent Clients</SectionLabel>
          {recent.map((c: any) => (
            <Pressable key={c.shopifyCustomerId} onPress={() => router.push(`/client/${c.shopifyCustomerId}`)} style={styles.clientRow}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitial}>{(c.firstName || '?')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{`${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}</Text>
                <Text style={styles.clientMeta}>{c.email || ''}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  columns: { flexDirection: 'row', gap: 24 },
  left: { flex: 1 },
  right: { width: 260 },
  greeting: { fontSize: 28, fontWeight: '300', color: Colors.navy, letterSpacing: -0.5 },
  summary: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  aptCard: { marginBottom: 10 },
  aptRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  aptTime: { minWidth: 48, alignItems: 'flex-end' },
  aptTimeText: { fontSize: 15, fontWeight: '600', color: Colors.navy },
  aptDuration: { fontSize: 11, color: Colors.muted },
  aptDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  aptName: { fontSize: 14, fontWeight: '600', color: Colors.navy },
  aptType: { fontSize: 12, color: Colors.muted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { fontSize: 14, color: Colors.muted, marginTop: 12 },
  actionBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, padding: 11, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  actionLabel: { fontSize: 13, fontWeight: '500', color: Colors.navy },
  clientRow: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 2, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  clientAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  clientInitial: { fontSize: 12, fontWeight: '700', color: Colors.navy },
  clientName: { fontSize: 13, fontWeight: '600', color: Colors.navy },
  clientMeta: { fontSize: 11, color: Colors.muted },
});

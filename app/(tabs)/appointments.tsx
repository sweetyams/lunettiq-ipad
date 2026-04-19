import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { LargeTitle } from '../../components/ui/LargeTitle';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import Colors from '../../constants/Colors';
import type { Appointment } from '../../lib/types';

const STATUS_VARIANT = { scheduled: 'default', confirmed: 'success', in_progress: 'warning', completed: 'success', no_show: 'error', cancelled: 'error' } as const;

export default function AppointmentsScreen() {
  const { appointments } = useApi();
  const router = useRouter();
  const [appts, setAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    appointments.list({ date: today }).then(setAppts).catch(console.error);
  }, []);

  const upcoming = appts.filter((a) => a.status === 'scheduled' || a.status === 'confirmed');
  const inProgress = appts.filter((a) => a.status === 'in_progress');
  const completed = appts.filter((a) => a.status === 'completed' || a.status === 'no_show');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LargeTitle title="Appointments" subtitle={new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })} />

      {inProgress.length > 0 && (
        <Section title="In Progress">
          {inProgress.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Separator />}
              <Row title={a.clientName || 'Client'} subtitle={`${a.startTime} · ${a.type}`} icon="clock-o" onPress={() => router.push(`/session/${a.clientId}`)} />
            </View>
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Separator />}
              <Row title={a.clientName || 'Client'} subtitle={`${a.startTime} · ${a.type}`} icon="calendar-o" onPress={() => router.push(`/appointment/${a.id}`)} />
            </View>
          ))}
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="Completed">
          {completed.map((a, i) => (
            <View key={a.id}>
              {i > 0 && <Separator />}
              <Row title={a.clientName || 'Client'} subtitle={`${a.startTime} · ${a.type}`} detail={a.status} icon="check-circle" accessory="none" />
            </View>
          ))}
        </Section>
      )}

      {appts.length === 0 && <Text style={styles.empty}>No appointments today</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  empty: { fontSize: 17, color: Colors.muted, textAlign: 'center', marginTop: 60 },
});

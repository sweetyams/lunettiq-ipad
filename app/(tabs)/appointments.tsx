import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';
import type { Appointment } from '../../lib/types';

export default function AppointmentsScreen() {
  const { apiFetch } = useApi();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    apiFetch<Appointment[]>(`/api/crm/appointments?date=${today}`).then(setAppointments).catch(console.error);
  }, []);

  const checkIn = (apt: Appointment) => {
    apiFetch(`/api/crm/appointments/${apt.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'in_progress' }) })
      .then(() => setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, status: 'in_progress' } : a)))
      .catch(console.error);
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No appointments today</Text>}
        renderItem={({ item }) => (
          <Card style={styles.mb}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.clientName || 'Client'}</Text>
                <Text style={styles.time}>{item.startTime} — {item.endTime}</Text>
                <Text style={styles.type}>{item.type} · {item.status}</Text>
              </View>
              <View style={styles.actions}>
                {(item.status === 'scheduled' || item.status === 'confirmed') && (
                  <Button title="Check In" onPress={() => checkIn(item)} variant="secondary" />
                )}
                {item.status === 'in_progress' && (
                  <Button title="Start Session" onPress={() => router.push(`/session/${item.clientId}`)} />
                )}
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite },
  list: { padding: 16 },
  mb: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '700', color: Colors.navy },
  time: { fontSize: 15, color: Colors.navy, marginTop: 4 },
  type: { fontSize: 15, color: Colors.muted, marginTop: 2 },
  actions: { gap: 8 },
  empty: { fontSize: 17, color: Colors.muted, textAlign: 'center', marginTop: 40 },
});

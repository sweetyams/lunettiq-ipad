import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../../lib/api';
import { Section, Row, Separator } from '../../components/ui/List';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import Colors from '../../constants/Colors';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appointments } = useApi();
  const router = useRouter();
  const [apt, setApt] = useState<any>(null);

  useEffect(() => {
    // Fetch from list since there's no single-appointment endpoint
    const today = new Date().toISOString().split('T')[0];
    appointments.list({ date: today }).then((list) => {
      const found = list.find((a: any) => a.id === id);
      if (found) setApt(found);
    }).catch(console.error);
  }, [id]);

  if (!apt) return null;

  const checkIn = async () => {
    await appointments.update(id!, { status: 'in_progress' });
    setApt((a: any) => ({ ...a, status: 'in_progress' }));
  };

  const noShow = () => {
    Alert.alert('No Show', 'Mark this appointment as no-show?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: async () => {
        await appointments.update(id!, { status: 'no_show' });
        router.back();
      }},
    ]);
  };

  const canCheckIn = apt.status === 'scheduled' || apt.status === 'confirmed';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="Details">
        <Row title="Client" detail={apt.clientName || '—'} icon="user" accessory="none" />
        <Separator />
        <Row title="Time" detail={`${apt.startTime} — ${apt.endTime}`} icon="clock-o" accessory="none" />
        <Separator />
        <Row title="Type" detail={apt.type} icon="tag" accessory="none" />
        <Separator />
        <Row title="Status" detail={apt.status} icon="info-circle" accessory="none" />
      </Section>

      {apt.notes && (
        <Section title="Notes">
          <Row title={apt.notes} accessory="none" />
        </Section>
      )}

      <View style={styles.actions}>
        {canCheckIn && <Button title="Check In" onPress={checkIn} />}
        {apt.status === 'in_progress' && <Button title="Start Session" onPress={() => router.push(`/session/${apt.clientId}`)} />}
        {canCheckIn && <Button title="No Show" onPress={noShow} variant="outline" />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  actions: { gap: 12, paddingHorizontal: 20, marginTop: 12 },
});

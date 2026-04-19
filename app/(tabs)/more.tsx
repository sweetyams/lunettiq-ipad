import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAppStore } from '../../lib/store';
import Colors from '../../constants/Colors';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { syncQueue, isOnline } = useAppStore();

  return (
    <View style={styles.screen}>
      <Card style={styles.mb}>
        <Text style={styles.h2}>Sync Status</Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: isOnline ? Colors.success : Colors.error }]} />
          <Text style={styles.body}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        {syncQueue.length > 0 && <Text style={styles.sub}>{syncQueue.length} pending changes</Text>}
      </Card>

      <Button title="Second Sight Intake" onPress={() => router.push('/second-sight/new')} style={styles.mb} />
      <Button title="Custom Design" onPress={() => router.push('/custom-design/new')} variant="secondary" style={styles.mb} />
      <Button title="Sign Out" onPress={() => signOut()} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.offWhite, padding: 20 },
  mb: { marginBottom: 16 },
  h2: { fontSize: 20, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  body: { fontSize: 17, color: Colors.navy },
  sub: { fontSize: 15, color: Colors.muted, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

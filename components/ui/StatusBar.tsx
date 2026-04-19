import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useAppStore } from '../../lib/store';
import Colors from '../../constants/Colors';

export function AppStatusBar() {
  const { isSignedIn } = useAuth();
  const { isOnline, syncQueue } = useAppStore();
  if (!isSignedIn) return null;

  const syncLabel = syncQueue.length === 0 ? 'Synced' : `${syncQueue.length} pending`;
  const syncColor = syncQueue.length === 0 ? Colors.success : '#FFC107';

  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <View style={styles.avatar}><Text style={styles.avatarText}>SA</Text></View>
        <Text style={styles.staff}>Staff</Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.location}>Montréal — Outremont</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.syncDot, { backgroundColor: syncColor }]} />
        <Text style={styles.syncText}>{syncLabel}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '700', color: Colors.white, letterSpacing: 0.4 },
  staff: { fontSize: 13, fontWeight: '500', color: Colors.white },
  dot: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  location: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  date: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 8 },
});

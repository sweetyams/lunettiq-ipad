import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../lib/store';
import Colors from '../../constants/Colors';

export function SessionBar() {
  const { activeSession, endClientSession } = useAppStore();
  const router = useRouter();

  if (!activeSession) return null;

  const elapsed = () => {
    const mins = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000);
    return mins < 1 ? 'Just started' : `${mins} min`;
  };

  return (
    <View style={styles.bar}>
      <View style={styles.indicator} />
      <Pressable onPress={() => router.push(`/client/${activeSession.clientId}`)} style={styles.clientInfo}>
        <Text style={styles.label}>SESSION</Text>
        <Text style={styles.name}>{activeSession.clientName}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={() => router.push(`/client/${activeSession.clientId}`)} style={styles.action}>
          <Text style={styles.actionText}>Profile</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/(tabs)/products', params: { clientId: activeSession.clientId } })} style={styles.action}>
          <Text style={styles.actionText}>Recommend</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/session/fitting', params: { clientId: activeSession.clientId, sessionId: '' } })} style={styles.action}>
          <Text style={styles.actionText}>Fitting</Text>
        </Pressable>
      </View>

      <Text style={styles.elapsed}>{elapsed()}</Text>

      <Pressable onPress={endClientSession} style={styles.endBtn}>
        <Text style={styles.endText}>End Session</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  clientInfo: { marginRight: 8 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '600', color: Colors.white },
  actions: { flex: 1, flexDirection: 'row', gap: 4 },
  action: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', minHeight: 32, justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '500', color: Colors.white },
  elapsed: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  endBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', minHeight: 32, justifyContent: 'center' },
  endText: { fontSize: 12, fontWeight: '600', color: Colors.white },
});

import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import Colors from '../constants/Colors';

export default function ShiftHandoff() {
  const { userId } = useAuth();
  const router = useRouter();
  const { currentSession, currentStaffId, setCurrentStaffId, addHandoff } = useAppStore();
  const [waiting, setWaiting] = useState(false);

  const startHandoff = async () => {
    setWaiting(true);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Colleague: authenticate to take over',
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      // In production, this would resolve the new staff identity from Clerk.
      // For now, we record the handoff with a timestamp.
      const newStaffId = `staff_${Date.now()}`;
      addHandoff({
        fromStaffId: currentStaffId || userId || 'unknown',
        toStaffId: newStaffId,
        timestamp: new Date().toISOString(),
        clientId: currentSession?.clientId,
      });
      setCurrentStaffId(newStaffId);

      Alert.alert(
        'Handoff Complete',
        currentSession
          ? `Continuing session with ${currentSession.clientId}. All actions now attributed to you.`
          : 'You are now the active SA on this device.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } else {
      Alert.alert('Authentication Failed', 'Handoff cancelled.');
    }
    setWaiting(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>Pass to Colleague</Text>
        <Text style={styles.body}>
          Hand this iPad to your colleague. They'll authenticate with Face ID to take over.
        </Text>
        {currentSession && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Active session will continue</Text>
          </View>
        )}
        <Button
          title={waiting ? 'Waiting for authentication...' : 'Start Handoff'}
          onPress={startHandoff}
          style={styles.btn}
        />
        <Button title="Cancel" onPress={() => router.back()} variant="outline" style={styles.btn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center' },
  content: { paddingHorizontal: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.black, marginBottom: 12 },
  body: { fontSize: 17, color: Colors.muted, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  banner: { backgroundColor: 'rgba(14,15,208,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginBottom: 24 },
  bannerText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  btn: { width: '100%', marginBottom: 10 },
});

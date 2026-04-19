import { ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { LargeTitle } from '../../components/ui/LargeTitle';
import { Section, Row, Separator } from '../../components/ui/List';
import { useAppStore } from '../../lib/store';
import Colors from '../../constants/Colors';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { syncQueue, isOnline } = useAppStore();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LargeTitle title="More" />

      <Section title="Tools">
        <Row title="Second Sight Intake" icon="refresh" onPress={() => router.push('/second-sight/new')} />
        <Separator />
        <Row title="Custom Design" icon="pencil" onPress={() => router.push('/custom-design/new')} />
      </Section>

      <Section title="Status">
        <Row title="Connection" detail={isOnline ? 'Online' : 'Offline'} icon="wifi" accessory="none" />
        <Separator />
        <Row title="Pending Sync" detail={`${syncQueue.length}`} icon="cloud-upload" accessory="none" />
      </Section>

      <Section title="Account">
        <Row title="Sign Out" icon="sign-out" onPress={() => signOut()} accessory="none" destructive />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
});

import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { HandedToClientView } from '@/src/features/fitting/HandedToClientView';
import { SessionBar } from '@/src/ui/SessionBar';
import { FloatingTabBar } from '@/src/ui/FloatingTabBar';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { useTodayAppointments } from '@/src/api/useAppointments';

export default function AppLayout() {
  const mode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Badge counts for notification dots
  const { data: rxSummary } = useRxApprovalSummary();
  const { data: todayAppointments } = useTodayAppointments();

  // Hide TabBar in fitting and handed modes
  const hideTabBar = mode === 'fitting' || handedToClient;

  // HANDED mode: full-screen takeover — client cannot navigate away
  if (handedToClient) {
    return <HandedToClientView />;
  }

  // Compute badge counts
  const badges: Record<string, number> = {};
  // Show count of upcoming (non-completed) appointments as badge
  const upcomingCount = todayAppointments?.filter(
    (a: { status: string }) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length ?? 0;
  if (upcomingCount > 0) {
    badges.appointments = upcomingCount;
  }
  if (rxSummary?.submitted) {
    badges.profile = rxSummary.submitted;
  }

  return (
    <View className="flex-1">
      {/* Persistent session bar — shows when session is active, across all tabs */}
      <SessionBar />

      <Tabs
        tabBar={(props) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hideTabBar ? null : <FloatingTabBar {...(props as any)} badges={badges} />
        }
        screenOptions={{
          headerShown: false,
          // Transparent tab bar background since we render our own floating bar
          tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
        <Tabs.Screen name="products" options={{ title: 'Products' }} />
        <Tabs.Screen name="appointments" options={{ title: 'Schedule' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        {/* More tab kept for routing but hidden from tab bar — accessed via Profile screen */}
        <Tabs.Screen
          name="more"
          options={{
            href: null, // Hides from tab bar
          }}
        />
      </Tabs>
    </View>
  );
}

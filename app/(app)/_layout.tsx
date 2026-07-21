import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Package, Calendar, MoreHorizontal } from 'lucide-react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { HandedToClientView } from '@/src/features/fitting/HandedToClientView';
import { SessionBar } from '@/src/ui/SessionBar';
import { useDesignTokens } from '@/src/features/design';

export default function AppLayout() {
  const { colors } = useDesignTokens();
  const mode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Hide TabBar in fitting and handed modes
  const hideTabBar = mode === 'fitting' || handedToClient;

  // HANDED mode: full-screen takeover — client cannot navigate away
  if (handedToClient) {
    return <HandedToClientView />;
  }

  return (
    <View className="flex-1">
      {/* Persistent session bar — shows when session is active, across all tabs */}
      <SessionBar />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1A1A1A',
          tabBarInactiveTintColor: '#A3A3A3',
          tabBarStyle: {
            display: hideTabBar ? 'none' : 'flex',
            backgroundColor: colors.bgPage,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Today', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: ({ color }) => <Users color={color} size={22} /> }} />
        <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color }) => <Package color={color} size={22} /> }} />
        <Tabs.Screen name="appointments" options={{ title: 'Appointments', tabBarIcon: ({ color }) => <Calendar color={color} size={22} /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <MoreHorizontal color={color} size={22} /> }} />
      </Tabs>
    </View>
  );
}

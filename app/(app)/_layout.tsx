import { Tabs } from 'expo-router';
import { Home, Users, Package, Calendar, MoreHorizontal } from 'lucide-react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

export default function AppLayout() {
  const mode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Hide TabBar in fitting and handed modes
  const hideTabBar = mode === 'fitting' || handedToClient;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex',
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5E5',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
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
  );
}

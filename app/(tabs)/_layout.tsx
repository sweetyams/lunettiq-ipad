import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { AppStatusBar } from '@/components/ui/StatusBar';
import { SessionBar } from '@/components/ui/SessionBar';
import Colors from '@/constants/Colors';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={20} {...props} />;
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppStatusBar />
      <SessionBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.white,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
          tabBarStyle: { backgroundColor: Colors.navy, borderTopColor: 'rgba(255,255,255,0.06)' },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: ({ color }) => <TabIcon name="users" color={color} /> }} />
        <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color }) => <TabIcon name="th-large" color={color} /> }} />
        <Tabs.Screen name="appointments" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} /> }} />
        <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <TabIcon name="ellipsis-h" color={color} /> }} />
      </Tabs>
    </View>
  );
}

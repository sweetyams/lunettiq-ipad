import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: ({ color }) => <TabIcon name="users" color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color }) => <TabIcon name="shopping-bag" color={color} /> }} />
      <Tabs.Screen name="appointments" options={{ title: 'Appointments', tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <TabIcon name="ellipsis-h" color={color} /> }} />
    </Tabs>
  );
}

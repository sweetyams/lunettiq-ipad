import { Stack } from 'expo-router';

// Clients is always underneath a profile, however it was opened (Floor, Orders, Approvals, holds):
// "‹ Clients" and the swipe go to the list, never back out to Floor.
export const unstable_settings = { initialRouteName: 'index' };

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/session" />
      <Stack.Screen name="[id]/fitting" />
    </Stack>
  );
}
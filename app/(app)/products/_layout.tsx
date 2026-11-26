import { Stack } from 'expo-router';

// Frames is always underneath a frame page, however it was opened (Home, a visit, a link,
// a colour or Optical/Sun switch): Back and the swipe go to the list, never out to Home.
export const unstable_settings = { initialRouteName: 'index' };

export default function ProductsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scanner" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}

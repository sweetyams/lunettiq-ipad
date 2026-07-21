import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="second-sight" />
      <Stack.Screen name="second-sight-demo" />
      <Stack.Screen name="custom-design" />
    </Stack>
  );
}
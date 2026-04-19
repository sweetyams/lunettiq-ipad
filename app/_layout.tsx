import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '../lib/auth';
import { useNetworkStatus } from '../lib/useNetwork';
import { useBiometricLock } from '../lib/useBiometric';
import { useSyncQueue } from '../lib/useSyncQueue';
import { usePhotoUploader } from '../lib/usePhotoUploader';

const CLERK_KEY = 'pk_test_c3VidGxlLXN1bmJlYW0tMTcuY2xlcmsuYWNjb3VudHMuZGV2JA';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useNetworkStatus();
  useSyncQueue();
  usePhotoUploader();
  const { locked, authenticate } = useBiometricLock();

  if (locked) {
    return (
      <View style={lockStyles.container}>
        <Text style={lockStyles.icon}>🔒</Text>
        <Text style={lockStyles.title}>Lunettiq</Text>
        <Pressable onPress={authenticate} style={lockStyles.btn}>
          <Text style={lockStyles.btnText}>Unlock with Face ID</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: '#F2F2F7' }, headerTintColor: '#000000', headerBackTitle: '' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
          <Stack.Screen name="client/new" options={{ title: 'New Client', presentation: 'modal' }} />
          <Stack.Screen name="session/[clientId]" options={{ title: 'Session', headerShown: false }} />
          <Stack.Screen name="session/fitting" options={{ title: 'Fitting', headerShown: false }} />
          <Stack.Screen name="appointment/[id]" options={{ title: 'Appointment' }} />
          <Stack.Screen name="second-sight/new" options={{ title: 'Second Sight', presentation: 'modal' }} />
          <Stack.Screen name="custom-design/new" options={{ title: 'Custom Design', presentation: 'modal' }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
          <Stack.Screen name="handoff" options={{ title: 'Shift Handoff', presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </ClerkProvider>
  );
}

const lockStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 32 },
  btn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgb(14,15,208)' },
  btnText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
});

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { tokenCache } from '../lib/auth';

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

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerStyle: { backgroundColor: '#F5F2EC' }, headerTintColor: '#0A153D', headerBackTitleVisible: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
          <Stack.Screen name="client/new" options={{ title: 'New Client', presentation: 'modal' }} />
          <Stack.Screen name="session/[clientId]" options={{ title: 'Session', headerShown: false }} />
          <Stack.Screen name="session/fitting" options={{ title: 'Fitting', headerShown: false }} />
          <Stack.Screen name="appointment/[id]" options={{ title: 'Appointment' }} />
          <Stack.Screen name="second-sight/new" options={{ title: 'Second Sight', presentation: 'modal' }} />
          <Stack.Screen name="custom-design/new" options={{ title: 'Custom Design', presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </ClerkProvider>
  );
}

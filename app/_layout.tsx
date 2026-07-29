import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, api } from '@/src/api/client';
import { DesignTokenProvider } from '@/src/features/design';
import { PrivacyModeProvider } from '@/src/features/privacy/PrivacyModeProvider';
import { SyncProvider } from '@/src/sync/SyncProvider';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { PushProvider } from '@/src/features/push';
import { ModeStrip } from '@/src/ui/ModeStrip';
import { ToastContainer } from '@/src/ui/Toast';
import { tokenCache } from '@/src/api/tokenCache';
import { DevErrorBoundary } from '@/src/ui/DevErrorBoundary';
import { EnvGate } from '@/src/ui/EnvGate';

function InitialLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Set up API client with Clerk token
  useEffect(() => {
    api.setTokenGetter(getToken);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // Redirect away from auth screens when signed in
      router.replace('/(app)/home');
    } else if (!isSignedIn && !inAuthGroup) {
      // Redirect to auth screens when not signed in
      router.replace('/(auth)/login');
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    // Clean loading state with Foundry design language
    return (
      <View className="flex-1 bg-brand items-center justify-center">
        <Text className="text-text-inverse text-2xl font-bold tracking-wider">
          LUNETTIQ
        </Text>
        <Text className="text-text-inverse/70 text-lg mt-2">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      {/* ModeStrip at the very top, below the system status bar */}
      {isSignedIn && <ModeStrip />}
      {/* Toast notifications — positioned below ModeStrip, above content */}
      <ToastContainer />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DevErrorBoundary context="root">
        <EnvGate>
          {/* DesignTokenProvider is outermost — fetches tokens before Clerk loads.
              No auth required. Falls back to cached/static tokens if offline. */}
          <DesignTokenProvider>
            <ClerkProvider
              publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
              tokenCache={tokenCache}
            >
              <QueryClientProvider client={queryClient}>
                <SyncProvider>
                  <PrivacyModeProvider>
                    <AuthProvider>
                      <PushProvider>
                        <DevErrorBoundary context="app">
                          <InitialLayout />
                        </DevErrorBoundary>
                      </PushProvider>
                    </AuthProvider>
                  </PrivacyModeProvider>
                </SyncProvider>
              </QueryClientProvider>
            </ClerkProvider>
          </DesignTokenProvider>
        </EnvGate>
      </DevErrorBoundary>
    </SafeAreaProvider>
  );
}

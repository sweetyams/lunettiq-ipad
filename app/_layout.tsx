import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, api } from '@/src/api/client';
import { PrivacyModeProvider } from '@/src/features/privacy/PrivacyModeProvider';
import { SyncProvider } from '@/src/sync/SyncProvider';
import { AuthProvider } from '@/src/features/auth/AuthProvider';
import { ModeStrip } from '@/src/ui/ModeStrip';
import { ToastContainer } from '@/src/ui/Toast';
import { tokenCache } from '@/src/api/tokenCache';
import { DevErrorBoundary } from '@/src/ui/DevErrorBoundary';
import { EnvGate } from '@/src/ui/EnvGate';

function InitialLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();

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
    <View className="flex-1">
      {/* ModeStrip at the very top, above all content */}
      {isSignedIn && <ModeStrip />}
      {/* Toast notifications — positioned below ModeStrip, above content */}
      {isSignedIn && <ToastContainer />}
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <DevErrorBoundary context="root">
      <EnvGate>
        <ClerkProvider 
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <SyncProvider>
              <PrivacyModeProvider>
                <AuthProvider>
                  <DevErrorBoundary context="app">
                    <InitialLayout />
                  </DevErrorBoundary>
                </AuthProvider>
              </PrivacyModeProvider>
            </SyncProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </EnvGate>
    </DevErrorBoundary>
  );
}

import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, Text } from 'react-native';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, api } from '@/src/api/client';
import { PrivacyModeProvider } from '@/src/features/privacy/PrivacyModeProvider';
import { SyncProvider } from '@/src/sync/SyncProvider';
import { tokenCache } from '@/src/api/tokenCache';

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
    // Loading state while Clerk initializes
    return (
      <View className="flex-1 bg-navy items-center justify-center">
        <Text className="text-offWhite text-2xl font-bold tracking-wider">
          LUNETTIQ
        </Text>
        <Text className="text-offWhite/70 text-lg mt-2">
          Loading...
        </Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <SyncProvider>
          <PrivacyModeProvider>
            <InitialLayout />
          </PrivacyModeProvider>
        </SyncProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

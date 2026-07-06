import { Slot } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/api/client';
import { PrivacyModeProvider } from '@/src/features/privacy/PrivacyModeProvider';
import { SyncProvider } from '@/src/sync/SyncProvider';

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <QueryClientProvider client={queryClient}>
        <SyncProvider>
          <PrivacyModeProvider>
            <Slot />
          </PrivacyModeProvider>
        </SyncProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

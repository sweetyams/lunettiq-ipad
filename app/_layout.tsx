import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
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
import { DemoStrip } from '@/src/ui/DemoStrip';
import { TenantCapabilityNotice } from '@/src/ui/TenantCapabilityNotice';
import { ToastContainer } from '@/src/ui/Toast';
import { tokenCache } from '@/src/api/tokenCache';
import { DevErrorBoundary } from '@/src/ui/DevErrorBoundary';
import { EnvGate } from '@/src/ui/EnvGate';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';
import { fetchMyProjects } from '@/src/features/tenant/useMyProjects';

/** Discovery phase for the signed-in user's project memberships. */
type Discovery =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'done' }
  | { phase: 'no-access' }
  | { phase: 'error'; message: string };

function InitialLayout() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeProject = useTenantStore((s) => s.activeProject);
  const setActiveProject = useTenantStore((s) => s.setActiveProject);
  const setKnownProjects = useTenantStore((s) => s.setKnownProjects);

  const [discovery, setDiscovery] = useState<Discovery>({ phase: 'idle' });
  const discoveryRanFor = useRef<string | null>(null);

  // Set up API client with Clerk token
  useEffect(() => {
    api.setTokenGetter(getToken);
  }, [getToken]);

  // Discover project memberships once per signed-in session.
  //
  // IMPORTANT: this runs even when an activeProject is already restored from MMKV — we
  // still need the full membership list in `knownProjects` so the Change-store UI and
  // picker work. We just DON'T auto-select / re-route when a project is already active.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      discoveryRanFor.current = null;
      if (discovery.phase !== 'idle') setDiscovery({ phase: 'idle' });
      return;
    }
    // Only run once per mount/sign-in.
    if (discoveryRanFor.current === 'ran') return;
    discoveryRanFor.current = 'ran';

    setDiscovery({ phase: 'loading' });
    (async () => {
      const outcome = await fetchMyProjects(getToken);
      switch (outcome.status) {
        case 'ok': {
          setKnownProjects(outcome.projects);
          // Auto-select only when nothing is active yet.
          if (!activeProject && outcome.projects.length === 1) {
            setActiveProject(outcome.projects[0]!);
          }
          setDiscovery({ phase: 'done' });
          break;
        }
        case 'no-access':
          setDiscovery({ phase: 'no-access' });
          break;
        case 'unauthorized':
          // Token invalid/expired — drop back to login.
          await signOut();
          break;
        case 'wrong-project':
          // Bootstrap host membership mismatch — treat as no access from this host.
          setDiscovery({
            phase: 'error',
            message: 'Could not reach a store you belong to. Contact your manager.',
          });
          break;
        case 'error':
          setDiscovery({ phase: 'error', message: outcome.message });
          break;
      }
    })();
  }, [isLoaded, isSignedIn, activeProject]);

  // Routing.
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onSelectProject = segments[1] === 'select-project';

    if (!isSignedIn) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    // Signed in, project already chosen → into the app.
    if (activeProject) {
      if (inAuthGroup) router.replace('/(app)/home');
      return;
    }

    // Signed in, no project yet — route by discovery outcome.
    if (discovery.phase === 'done' && !onSelectProject) {
      // >1 project (auto-select handled activeProject above) → picker.
      router.replace('/(auth)/select-project');
    }
  }, [isLoaded, isSignedIn, segments, activeProject, discovery.phase]);

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

  // Signed in, discovering memberships — hold with a loading state.
  if (isSignedIn && !activeProject && discovery.phase === 'loading') {
    return (
      <View className="flex-1 bg-bg-page items-center justify-center">
        <Text className="text-heading-md text-text-primary">Loading your stores…</Text>
      </View>
    );
  }

  // Valid login but no store memberships, or a bootstrap error.
  if (
    isSignedIn &&
    !activeProject &&
    (discovery.phase === 'no-access' || discovery.phase === 'error')
  ) {
    const isError = discovery.phase === 'error';
    return (
      <View className="flex-1 bg-bg-page items-center justify-center px-8">
        <View className="w-full max-w-[360px] items-center">
          <Text className="text-heading-lg text-text-primary text-center">
            {isError ? 'Something went wrong' : 'No store access'}
          </Text>
          <Text className="text-body-md text-text-muted mt-sm text-center">
            {isError
              ? (discovery as { message: string }).message
              : "Your account isn't a member of any store yet. Contact your manager to get access."}
          </Text>
          <Pressable
            onPress={() => signOut()}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            className="mt-xl rounded-lg py-md px-lg min-h-[44px] items-center justify-center border border-border w-full"
          >
            <Text className="text-body-md font-medium text-text-primary">Sign out</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      {/* ModeStrip at the very top, below the system status bar */}
      {isSignedIn && activeProject && <ModeStrip />}
      {/* Demo/staging indicator — directly below the privacy strip */}
      {isSignedIn && activeProject && <DemoStrip />}
      {/* Uncapable-tenant notice — when the active store lacks required modules */}
      {isSignedIn && activeProject && <TenantCapabilityNotice />}
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

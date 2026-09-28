import { View, Text, Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { AlertTriangle } from 'lucide-react-native';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';

/**
 * Banner shown when the active store is not set up for the iPad app.
 *
 * Authoritative signal: `my-projects` returns `ipadReady` per project. A store with
 * `ipadReady === false` (e.g. `bentspline`) can't run the app's core flows, so we tell
 * the user plainly and give them a way out (change store / sign out).
 *
 * NOTE: this is NOT the same as "device quick-switch (PIN) is disabled". A store can be
 * fully iPad-ready and simply not use PIN quick-switch — that must not trigger this
 * banner. PIN availability is handled separately in AuthProvider.
 *
 * See docs/multi-project/04-capability-gap.md.
 */
export function TenantCapabilityNotice() {
  const { signOut } = useAuth();
  const activeProject = useTenantStore((s) => s.activeProject);
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const clearActiveProject = useTenantStore((s) => s.clearActiveProject);
  const clearOperator = useOperatorStore((s) => s.clearOperator);

  // Only show when the store explicitly reports it is not iPad-ready.
  // (undefined = unknown/older backend → don't nag.)
  if (activeProject?.ipadReady !== false) return null;

  const name = activeProject?.name;
  const canChangeStore = knownProjects.length > 1;

  const handleChangeStore = (): void => {
    clearOperator();
    clearActiveProject(); // root gate re-runs discovery → picker
  };

  const handleSignOut = (): void => {
    clearOperator();
    void signOut();
  };

  return (
    <View className="bg-warning-soft border-b border-border px-lg py-md">
      <View className="flex-row items-start gap-sm">
        <AlertTriangle size={18} color="#B54708" />
        <View className="flex-1">
          <Text className="text-body-sm text-text-primary font-medium">
            {name ?? 'This store'} isn't set up for the iPad app
          </Text>
          <Text className="text-caption-md text-text-muted mt-xs">
            {canChangeStore
              ? 'Some features are unavailable here. Switch to another store or sign out.'
              : 'Some features are unavailable here. Contact your manager, or sign out.'}
          </Text>
          <View className="flex-row gap-md mt-sm">
            {canChangeStore && (
              <Pressable
                onPress={handleChangeStore}
                accessibilityRole="button"
                accessibilityLabel="Change store"
                className="min-h-[44px] justify-center"
              >
                <Text className="text-body-sm text-brand font-medium">Change store</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              className="min-h-[44px] justify-center"
            >
              <Text className="text-body-sm text-text-secondary font-medium">Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

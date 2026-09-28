import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';
import { useDeviceLocationId } from '@/src/features/tenant/useDeviceLocationStore';
import { useLocations } from '@/src/api/useLocations';

/**
 * First-run device-location prompt.
 *
 * Shown when the active store is iPad-ready, has locations, but this device has no
 * location pinned yet. Location is a manager setting (see Profile → Store → Location), so
 * this banner points there rather than opening the picker inline — a sales associate
 * shouldn't set the till's branch.
 *
 * Non-blocking: the app still works (reads default to all, writes send no location) but a
 * pinned branch is needed for correct scoping/attribution.
 *
 * See docs/multi-project/06-device-location-scope.md (Phase L4).
 */
export function DeviceLocationNotice() {
  const router = useRouter();
  const activeProject = useTenantStore((s) => s.activeProject);
  const deviceLocationId = useDeviceLocationId();
  const { data: locations } = useLocations();
  const [dismissed, setDismissed] = useState(false);

  // Only when: store is iPad-ready, has locations, none pinned, not dismissed this session.
  const shouldShow =
    !dismissed &&
    activeProject?.ipadReady !== false &&
    !deviceLocationId &&
    (locations?.length ?? 0) > 0;

  if (!shouldShow) return null;

  const canManage = activeProject?.role === 'admin' || activeProject?.role === 'owner';

  return (
    <View className="bg-bg-muted border-b border-border px-lg py-md">
      <View className="flex-row items-start gap-sm">
        <MapPin size={18} color="#737373" />
        <View className="flex-1">
          <Text className="text-body-sm text-text-primary font-medium">
            Set this device's location
          </Text>
          <Text className="text-caption-md text-text-muted mt-xs">
            {canManage
              ? 'Pin this iPad to a store branch so sessions and stock are recorded correctly.'
              : 'A manager should set this iPad’s branch in Profile → Store → Location.'}
          </Text>
          <View className="flex-row gap-md mt-sm">
            {canManage && (
              <Pressable
                onPress={() => router.push('/(app)/profile')}
                accessibilityRole="button"
                accessibilityLabel="Set device location"
                className="min-h-[44px] justify-center"
              >
                <Text className="text-body-sm text-brand font-medium">Set location</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setDismissed(true)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              className="min-h-[44px] justify-center"
            >
              <Text className="text-body-sm text-text-secondary font-medium">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

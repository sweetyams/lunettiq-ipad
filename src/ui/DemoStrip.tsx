import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';

/**
 * Demo-store indicator.
 *
 * Shown whenever the active project's env isn't `production`, so staff never
 * confuse the demo store with a live client store. Builder style: a small
 * status pill floating at the top centre (like the Builder's "draft" pill),
 * not a full-width coloured band. Doesn't take layout space or touches.
 */
export function DemoStrip() {
  const env = useTenantStore((s) => s.activeProject?.env);
  const name = useTenantStore((s) => s.activeProject?.name);
  const { top } = useSafeAreaInsets();

  if (!env || env === 'production') return null;

  const label = env === 'demo' ? 'Demo store' : 'Staging';

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center z-50"
      style={{ top: Math.max(top, 8) + 4 }}
      accessibilityRole="alert"
      accessibilityLabel={`${name ?? 'This'} is a ${env} store, not a live store`}
    >
      <View className="flex-row items-center gap-[6px] bg-warning-soft border border-warning-ring rounded-full px-[10px] py-[3px]">
        <View className="w-[6px] h-[6px] rounded-full bg-warning" />
        <Text className="text-body-sm font-medium text-warning">{label} · not live</Text>
      </View>
    </View>
  );
}

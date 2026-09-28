import { View, Text } from 'react-native';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';

/**
 * Demo-store indicator strip.
 *
 * Shown at the top of the screen whenever the active project's env is `demo`, so staff
 * can never confuse the demo store with a live client store. Non-production environments
 * (`staging`) are labelled too. Nothing renders for `production`.
 *
 * Sits directly below the privacy ModeStrip. Token colors only.
 */
export function DemoStrip() {
  const env = useTenantStore((s) => s.activeProject?.env);
  const name = useTenantStore((s) => s.activeProject?.name);

  if (!env || env === 'production') return null;

  const label = env === 'demo' ? 'Demo store — not live' : 'Staging — not live';

  return (
    <View
      className="h-[22px] bg-warning w-full items-center justify-center"
      accessibilityRole="alert"
      accessibilityLabel={`${name ?? 'This'} is a ${env} store, not a live store`}
    >
      <Text className="text-text-inverse text-caption-md tracking-[0.12em] uppercase">
        {label}
      </Text>
    </View>
  );
}

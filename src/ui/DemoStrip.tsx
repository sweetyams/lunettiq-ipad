import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { usePendingVisitCount } from '@/src/features/session/VisitOutboxWorker';

/**
 * Demo-store indicator.
 *
 * Shown whenever the active project's env isn't `production`, so staff never
 * confuse the demo store with a live client store. Builder style: a small
 * status pill floating at the top centre (like the Builder's "draft" pill),
 * not a full-width coloured band. Doesn't take layout space or touches.
 * Also shows sync state: offline, and visits ended on the iPad that haven't
 * reached Foundry yet (visit outbox).
 */
export function DemoStrip() {
  const env = useTenantStore((s) => s.activeProject?.env);
  const name = useTenantStore((s) => s.activeProject?.name);
  const { top } = useSafeAreaInsets();
  const handed = usePrivacyStore((s) => s.handedToClient);
  const isOnline = useSyncStore((s) => s.isOnline);
  const pendingVisits = usePendingVisitCount();

  const showEnv = !!env && env !== 'production';
  const syncLabel = !isOnline
    ? pendingVisits ? `Offline · ${pendingVisits} ${pendingVisits === 1 ? 'visit' : 'visits'} to sync` : 'Offline'
    : pendingVisits ? `Syncing ${pendingVisits} ${pendingVisits === 1 ? 'visit' : 'visits'}` : null;

  // Never in front of a client.
  if (handed || (!showEnv && !syncLabel)) return null;

  const label = env === 'demo' ? 'Demo store' : 'Staging';

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center z-50"
      style={{ top: Math.max(top, 8) + 4 }}
      accessibilityRole="alert"
      accessibilityLabel={[showEnv ? `${name ?? 'This'} is a ${env} store, not a live store` : null, syncLabel].filter(Boolean).join('. ')}
    >
      <View className="flex-row items-center gap-[8px]">
        {showEnv ? (
          <View className="flex-row items-center gap-[6px] bg-warning-soft border border-warning-ring rounded-full px-[10px] py-[3px]">
            <View className="w-[6px] h-[6px] rounded-full bg-warning" />
            <Text className="text-body-sm font-medium text-warning">{label} · not live</Text>
          </View>
        ) : null}
        {syncLabel ? (
          <View className="flex-row items-center gap-[6px] bg-bg-page border border-border rounded-full px-[10px] py-[3px]">
            <View className={`w-[6px] h-[6px] rounded-full ${isOnline ? 'bg-info' : 'bg-text-tertiary'}`} />
            <Text className="text-body-sm font-medium text-text-secondary">{syncLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

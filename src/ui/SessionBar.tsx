import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { useClient } from '@/src/api/useClients';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useAuthContext } from '@/src/features/auth/AuthProvider';
import { EndSessionSheet } from '@/src/features/session/EndSessionSheet';
import { Badge, Button, StatusDot, kitColors } from '@/src/ui/kit';

function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return '0:00';
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * SessionBar — shows on every tab while a visit is open, so staff can jump
 * back to it or end it. Hidden on the visit and fitting screens (they have
 * their own header).
 */
export function SessionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeClientId, activeClientName, mode, sessionStartedAt, framesTried } = useSessionStore();
  const [showEnd, setShowEnd] = useState(false);
  const { activeOperator } = useOperatorStore();
  const { lock, pinEnabled } = useAuthContext();
  const { data: client } = useClient(activeClientId ?? '');
  const elapsed = useElapsed(sessionStartedAt);

  if (mode === 'idle' || !activeClientId) return null;
  if (pathname?.includes(`/clients/${activeClientId}/session`) || pathname?.includes(`/clients/${activeClientId}/fitting`)) return null;

  const tier = client?.tags?.find((t) => t.startsWith('member-'))?.replace('member-', '').toUpperCase();
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length;
  const openVisit = () => router.push(`/clients/${activeClientId}/session`);

  return (
    <>
      <View className="flex-row items-center gap-[12px] h-[60px] px-[32px] bg-bg-page border-b border-border">
        <Pressable
          onPress={openVisit}
          accessibilityRole="button"
          accessibilityLabel={`Visit with ${activeClientName ?? 'client'} in progress, ${elapsed}. Open the visit.`}
          className="flex-row items-center gap-[10px] flex-1 min-h-[44px]"
        >
          <StatusDot tone="success" />
          <Text className="text-body-md font-medium text-text-primary" numberOfLines={1}>{activeClientName ?? 'Client'}</Text>
          {tier ? <Badge tone="info">{tier}</Badge> : null}
          <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }} numberOfLines={1}>
            Visit · {elapsed}{framesTried.length ? ` · ${framesTried.length} tried` : ''}{loved ? ` · ${loved} loved` : ''}{mode === 'fitting' ? ' · fitting' : ''}
          </Text>
          <ChevronRight size={16} color={kitColors.iconMuted} />
        </Pressable>
        {activeOperator && pinEnabled ? (
          <Button label={activeOperator.name.split(' ')[0] ?? 'Switch'} icon={RefreshCw} size="sm" variant="ghost" onPress={lock} accessibilityLabel={`Signed in as ${activeOperator.name}. Switch user.`} />
        ) : null}
        <Button label="Open visit" size="sm" onPress={openVisit} />
        <Button label="End visit" size="sm" variant="ghost" onPress={() => setShowEnd(true)} />
      </View>

      <EndSessionSheet
        visible={showEnd}
        onDismiss={() => setShowEnd(false)}
        onComplete={() => { setShowEnd(false); router.replace('/(app)/home'); }}
      />
    </>
  );
}

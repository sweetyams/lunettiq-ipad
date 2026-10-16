import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  useReviewQueue,
  useRxApprovalSummary,
  useClaimApproval,
  useReleaseApproval,
  useApprovalHeartbeat,
} from '@/src/api/useRxApprovals';
import { formatWaiting, type ReviewItem } from '@/src/api/rxMapping';
import { Avatar } from '@/src/ui';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { toast } from '@/src/ui/useToastStore';

type Tab = 'submitted' | 'in_review' | 'completed';
const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'submitted', label: 'Pending' },
  { key: 'in_review', label: 'In review' },
  { key: 'completed', label: 'Done' },
];

function ReviewRow({ item, tab, busy, onClaim, onRelease, onOpen }: {
  item: ReviewItem;
  tab: Tab;
  busy: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onOpen: () => void;
}) {
  const [first, ...rest] = item.clientName.split(' ');
  return (
    <View className={`flex-row items-center gap-lg bg-bg-surface border border-border border-l-4 ${item.anomaly ? 'border-l-error' : 'border-l-border'} rounded-lg px-lg py-md mb-sm min-h-[96px]`}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${item.clientName}`} className="flex-row items-center gap-lg flex-1">
        <Avatar firstName={first ?? ''} lastName={rest.join(' ')} size="md" />
        <View className="flex-1">
          <Text className="text-heading-lg text-text-primary" numberOfLines={1}>{item.clientName}</Text>
          <Text className="text-body-sm text-text-secondary mt-xs" numberOfLines={1}>
            {item.description}{item.pd ? ` · PD ${item.pd}` : ''}
          </Text>
          {item.anomaly ? (
            <Text className="text-body-sm font-medium text-error mt-xs" numberOfLines={1}>{item.anomaly}</Text>
          ) : null}
        </View>
      </Pressable>
      <View className="items-end gap-sm">
        <Text className="text-body-sm text-text-muted">
          {item.priority === 'high' ? 'High priority · ' : ''}{formatWaiting(item.minutesWaiting)} ago
        </Text>
        {tab === 'submitted' ? (
          <Pressable onPress={onClaim} disabled={busy} accessibilityRole="button" className="bg-accent rounded-md px-lg min-h-[44px] items-center justify-center">
            <Text className="text-body-md font-medium text-accent-text">Claim</Text>
          </Pressable>
        ) : tab === 'in_review' ? (
          <Pressable onPress={onRelease} disabled={busy} accessibilityRole="button" className="border border-border rounded-md px-lg min-h-[44px] items-center justify-center">
            <Text className="text-body-md font-medium text-text-primary">Release</Text>
          </Pressable>
        ) : (
          <Text className="text-body-sm text-text-muted capitalize">{item.status}</Text>
        )}
      </View>
    </View>
  );
}

function ReviewContent() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('submitted');
  const { data: summary } = useRxApprovalSummary();
  const { data: items, isLoading, error, refetch, isRefetching } = useReviewQueue(tab);
  const claim = useClaimApproval();
  const release = useReleaseApproval();
  const heartbeat = useApprovalHeartbeat();

  // Keep a claimed request alive while the optician works on it.
  const [claimedId, setClaimedId] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!claimedId) return;
    heartbeatRef.current = setInterval(() => heartbeat.mutate(claimedId), 30_000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimedId]);

  const doClaim = async (id: string) => {
    try {
      await claim.mutateAsync(id);
      setClaimedId(id);
      toast.success('Claimed', 'It’s in your review list now.');
    } catch {
      toast.error('Couldn’t claim', 'Another optician may have taken it. Refresh and try the next one.');
    }
  };
  const doRelease = async (id: string) => {
    try {
      await release.mutateAsync(id);
      setClaimedId(null);
      toast.info('Released', 'Back in the pending queue.');
    } catch {
      toast.error('Couldn’t release', 'Check the connection and try again.');
    }
  };

  const list = items ?? [];
  const next = tab === 'submitted' ? list[0] : undefined;

  return (
    <View className="flex-1 bg-bg-page">
      <View className="px-xl pt-2xl pb-md border-b border-border">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-display-lg text-text-primary">Review</Text>
            <Text className="text-body-md text-text-muted mt-xs">
              {summary?.submitted ?? 0} waiting · {summary?.in_review ?? 0} in review · {summary?.approved ?? 0} signed off today
            </Text>
          </View>
          {next ? (
            <Pressable onPress={() => doClaim(next.id)} disabled={claim.isPending} accessibilityRole="button" className="bg-accent rounded-md px-xl min-h-[48px] items-center justify-center">
              <Text className="text-body-md font-medium text-accent-text">Claim next: {next.clientName}</Text>
            </Pressable>
          ) : null}
        </View>
        <View className="flex-row gap-sm mt-lg">
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} accessibilityRole="button" accessibilityState={{ selected: on }}
                className={`px-lg min-h-[44px] rounded-full border items-center justify-center ${on ? 'bg-accent border-accent' : 'border-border'}`}>
                <Text className={`text-body-md font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : list.length === 0 ? (
        <EmptyState message={tab === 'submitted' ? 'Nothing waiting for review.' : tab === 'in_review' ? 'Nothing claimed right now.' : 'No completed reviews yet.'} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <ReviewRow
              item={item}
              tab={tab}
              busy={claim.isPending || release.isPending}
              onClaim={() => doClaim(item.id)}
              onRelease={() => doRelease(item.id)}
              onOpen={() => router.push(`/clients/${item.clientId}`)}
            />
          )}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </View>
  );
}

export default function ReviewScreen() {
  return (
    <PermissionGate
      permissions={['org:rx:verify', 'org:rx:sign_off']}
      fallback={<EmptyState message="Review is for licensed opticians. Ask a manager if you need access." />}
    >
      <ReviewContent />
    </PermissionGate>
  );
}

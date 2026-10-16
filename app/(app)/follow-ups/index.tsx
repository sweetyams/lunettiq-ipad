import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useFollowUps } from '@/src/api/useHotLeads';
import { DUE_LABELS, type FollowUp, type FollowUpDue } from '@/src/api/hotLeadsMapping';
import { Avatar } from '@/src/ui';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';

/** Edge colour + badge per urgency. Text colour is set on Text (RN doesn't inherit it). */
const DUE_STYLES: Record<FollowUpDue, { edge: string; badgeBg: string; badgeFg: string }> = {
  last_chance: { edge: 'border-l-error', badgeBg: 'bg-error-soft', badgeFg: 'text-error' },
  call_now: { edge: 'border-l-accent', badgeBg: 'bg-accent', badgeFg: 'text-accent-text' },
  email_sent: { edge: 'border-l-border', badgeBg: 'bg-bg-muted', badgeFg: 'text-text-secondary' },
  new: { edge: 'border-l-border', badgeBg: 'bg-bg-muted', badgeFg: 'text-text-secondary' },
};

const PRIORITY_LABEL = { hot: 'Hot lead', warm: 'Warm lead', cold: 'Cold lead' } as const;

function FollowUpRow({ item, onPress }: { item: FollowUp; onPress: () => void }) {
  const s = DUE_STYLES[item.due];
  const [first, ...rest] = item.clientName.split(' ');
  const detail = [
    item.signalsLabel ?? (item.due === 'email_sent' ? 'No email opens yet' : null),
    item.discountPercent > 0 ? `${item.discountPercent}% authorized` : null,
    PRIORITY_LABEL[item.priority],
  ].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.clientName}, ${item.frame ?? 'frames tried'}, ${DUE_LABELS[item.due]}, day ${item.day}`}
      className={`flex-row items-center gap-lg bg-bg-surface border border-border border-l-4 ${s.edge} rounded-lg px-lg py-md mb-sm min-h-[88px]`}
    >
      <Avatar firstName={first ?? ''} lastName={rest.join(' ')} size="md" />
      <View className="flex-1">
        <Text className="text-heading-lg text-text-primary" numberOfLines={1}>
          {item.clientName}{item.frame ? <Text className="text-text-secondary"> · {item.frame}</Text> : null}
        </Text>
        <Text className="text-body-sm text-text-muted mt-xs" numberOfLines={1}>{detail}</Text>
      </View>
      <View className="items-end gap-xs">
        <View className={`rounded-sm px-sm py-[2px] ${s.badgeBg}`}>
          <Text className={`text-body-sm font-medium ${s.badgeFg}`}>{DUE_LABELS[item.due]}</Text>
        </View>
        <Text className="text-body-sm text-text-muted">Day {item.day}{item.phone ? ` · ${item.phone}` : ''}</Text>
      </View>
    </Pressable>
  );
}

export default function FollowUpsScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useFollowUps();
  const items = data ?? [];
  const toCall = useMemo(() => items.filter((i) => i.due === 'call_now').length, [items]);
  const lastChance = useMemo(() => items.filter((i) => i.due === 'last_chance').length, [items]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <View className="flex-1 bg-bg-page">
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <Text className="text-display-lg text-text-primary">Follow-ups</Text>
        <Text className="text-body-md text-text-muted mt-xs">
          {toCall} to call today{lastChance ? ` · ${lastChance} last chance` : ''} · clients who tried frames and didn't buy
        </Text>
      </View>
      {items.length === 0 ? (
        <EmptyState message="No follow-ups. Clients who try frames and leave without buying appear here." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <FollowUpRow item={item} onPress={() => router.push(`/clients/${item.clientId}`)} />}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </View>
  );
}

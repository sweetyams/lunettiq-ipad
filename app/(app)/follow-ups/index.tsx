import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useFollowUps } from '@/src/api/useHotLeads';
import { DUE_LABELS, type FollowUp, type FollowUpDue } from '@/src/api/hotLeadsMapping';
import { Avatar } from '@/src/ui/Avatar';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Badge, ListRow, PageHeader, Section, formatPhone, type BadgeTone } from '@/src/ui/kit';

const DUE_TONE: Record<FollowUpDue, BadgeTone> = {
  last_chance: 'danger',
  call_now: 'warning',
  email_sent: 'neutral',
  new: 'outline',
};
const PRIORITY_LABEL = { hot: 'Hot lead', warm: 'Warm lead', cold: 'Cold lead' } as const;

function FollowUpRow({ item, first, onPress }: { item: FollowUp; first: boolean; onPress: () => void }) {
  const [firstName, ...rest] = item.clientName.split(' ');
  const detail = [
    item.signalsLabel ?? (item.due === 'email_sent' ? 'No email opens yet' : null),
    item.discountPercent > 0 ? `${item.discountPercent}% authorized` : null,
    PRIORITY_LABEL[item.priority],
  ].filter(Boolean).join(' · ');
  return (
    <ListRow
      divider={!first}
      onPress={onPress}
      accessibilityLabel={`${item.clientName}, ${item.frame ?? 'frames tried'}, ${DUE_LABELS[item.due]}, day ${item.day}`}
      leading={<Avatar firstName={firstName ?? ''} lastName={rest.join(' ')} size="md" />}
      title={
        <Text className="text-body-lg font-medium text-text-primary" numberOfLines={1}>
          {item.clientName}
          {item.frame ? <Text className="font-normal text-text-tertiary">{`  ${item.frame}`}</Text> : null}
        </Text>
      }
      subtitle={detail}
      trailing={
        <View className="items-end gap-[6px]">
          <Badge tone={DUE_TONE[item.due]} dot>{DUE_LABELS[item.due]}</Badge>
          <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
            Day {item.day}{item.phone ? ` · ${formatPhone(item.phone)}` : ''}
          </Text>
        </View>
      }
    />
  );
}

export default function FollowUpsScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useFollowUps();
  const items = data ?? [];
  const today = useMemo(() => items.filter((i) => i.due === 'call_now' || i.due === 'last_chance'), [items]);
  const later = useMemo(() => items.filter((i) => i.due === 'email_sent' || i.due === 'new'), [items]);
  const open = (i: FollowUp) => router.push(`/clients/${i.clientId}`);

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title="Follow-ups"
        subtitle={`${today.length} to call today · clients who tried frames and didn't buy`}
      />
      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : items.length === 0 ? (
        <EmptyState message="No follow-ups. Clients who try frames and leave without buying appear here." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 32, paddingBottom: 140, gap: 24 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {today.length ? (
            <Section title="Call today" count={today.length} padded={false}>
              {today.map((i, idx) => <FollowUpRow key={i.id} item={i} first={idx === 0} onPress={() => open(i)} />)}
            </Section>
          ) : null}
          {later.length ? (
            <Section title="In the sequence" count={later.length} padded={false}>
              {later.map((i, idx) => <FollowUpRow key={i.id} item={i} first={idx === 0} onPress={() => open(i)} />)}
            </Section>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState } from 'react';
import {
  useReviewQueue,
  useRxApprovalSummary,
  useClaimApproval,
  useReleaseApproval,
} from '@/src/api/useRxApprovals';
import { ApprovalReviewSheet } from '@/src/features/approvals/ApprovalReviewSheet';
import { formatWaiting, type ReviewItem } from '@/src/api/rxMapping';
import { Avatar } from '@/src/ui/Avatar';
import { Badge, Button, FilterChips, ListRow, PageHeader, Section } from '@/src/ui/kit';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { toast } from '@/src/ui/useToastStore';

type Tab = 'submitted' | 'in_review' | 'completed';
const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'submitted', label: 'Pending' },
  { key: 'in_review', label: 'Being checked' },
  { key: 'completed', label: 'Done' },
];

function ReviewRow({ item, tab, first, busy, onClaim, onRelease, onOpen }: {
  item: ReviewItem;
  tab: Tab;
  first: boolean;
  busy: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onOpen: () => void;
}) {
  const [firstName, ...rest] = item.clientName.split(' ');
  return (
    <ListRow
      divider={!first}
      onPress={onOpen}
      accessibilityLabel={`${item.clientName}, ${item.description}${item.anomaly ? ', flagged' : ''}`}
      leading={<Avatar firstName={firstName ?? ''} lastName={rest.join(' ')} size="md" />}
      title={item.clientName}
      subtitle={
        <View className="gap-[6px] mt-[2px]">
          <Text className="text-body-sm text-text-tertiary" numberOfLines={1}>
            {item.description}{item.pd ? ` · PD ${item.pd}` : ''}
          </Text>
          {item.anomaly ? <View className="flex-row"><Badge tone="danger" dot>{item.anomaly}</Badge></View> : null}
        </View>
      }
      trailing={
        <View className="flex-row items-center gap-[12px]">
          <View className="items-end gap-[4px]">
            {item.priority === 'high' ? <Badge tone="warning">High priority</Badge> : null}
            <Text className="text-body-sm text-text-tertiary">{formatWaiting(item.minutesWaiting)} waiting</Text>
          </View>
          {tab === 'submitted' ? (
            <Button label="Claim" size="sm" onPress={onClaim} disabled={busy} />
          ) : tab === 'in_review' ? (
            <Button label="Release" size="sm" variant="ghost" onPress={onRelease} disabled={busy} />
          ) : (
            <Badge tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'neutral'}>{item.status}</Badge>
          )}
        </View>
      }
    />
  );
}

function ReviewContent() {
  const [tab, setTab] = useState<Tab>('submitted');
  // The request under review: tapping a row used to open the client profile, with no way to act.
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: summary } = useRxApprovalSummary();
  const { data: items, isLoading, error, refetch, isRefetching } = useReviewQueue(tab);
  const claim = useClaimApproval();
  const release = useReleaseApproval();

  const doClaim = async (id: string) => {
    try {
      await claim.mutateAsync(id);
      // Straight into the review (the sheet keeps the review time going while it's open).
      setOpenId(id);
    } catch {
      toast.error('Couldn’t claim', 'Another optician may have taken it. Refresh and try the next one.');
    }
  };
  const doRelease = async (id: string) => {
    try {
      await release.mutateAsync(id);
      toast.info('Released', 'Back in the pending queue.');
    } catch {
      toast.error('Couldn’t release', 'Check the connection and try again.');
    }
  };

  const list = items ?? [];
  const next = tab === 'submitted' ? list[0] : undefined;

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title="Approvals"
        subtitle={`${summary?.submitted ?? 0} pending approval · ${summary?.in_review ?? 0} being checked · ${summary?.approved ?? 0} approved today`}
        actions={next ? (
          <Button label={`Claim next · ${next.clientName}`} variant="primary" onPress={() => doClaim(next.id)} disabled={claim.isPending} />
        ) : undefined}
      />
      <View className="px-[32px] pt-[20px] pb-[4px]">
        <FilterChips<Tab> value={tab} onChange={setTab} options={TABS} />
      </View>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : list.length === 0 ? (
        <EmptyState message={tab === 'submitted' ? 'Nothing pending approval.' : tab === 'in_review' ? 'Nothing claimed right now.' : 'No completed reviews yet.'} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 32, paddingTop: 20, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          <Section padded={false}>
            {list.map((item, i) => (
              <ReviewRow
                key={item.id}
                item={item}
                tab={tab}
                first={i === 0}
                busy={claim.isPending || release.isPending}
                onClaim={() => doClaim(item.id)}
                onRelease={() => doRelease(item.id)}
                onOpen={() => setOpenId(item.id)}
              />
            ))}
          </Section>
        </ScrollView>
      )}
      {openId ? <ApprovalReviewSheet id={openId} onClose={() => setOpenId(null)} /> : null}
    </View>
  );
}

export default function ReviewScreen() {
  return (
    <PermissionGate
      permissions={['org:rx:verify', 'org:rx:sign_off']}
      fallback={<EmptyState message="Approvals are for licensed opticians. Ask a manager if you need access." />}
    >
      <ReviewContent />
    </PermissionGate>
  );
}

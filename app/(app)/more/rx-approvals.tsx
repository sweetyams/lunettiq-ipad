import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { FileCheck } from 'lucide-react-native';
import {
  useRxApprovalQueue,
  useRxApprovalSummary,
  useClaimApproval,
  useReleaseApproval,
  useSignOffApproval,
  useReturnApproval,
  useRejectApproval,
  useApprovalHeartbeat,
} from '@/src/api/useRxApprovals';
import type { RxApproval, ApprovalStatus } from '@/src/api/rx-approvals.types';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Button } from '@/src/ui/Button';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { toast } from '@/src/ui/useToastStore';

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned',
};

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  draft: 'bg-warmGrey',
  submitted: 'bg-warning/20',
  in_review: 'bg-blue/20',
  approved: 'bg-green/20',
  rejected: 'bg-error/20',
  returned: 'bg-warning/20',
};

type TabFilter = 'submitted' | 'in_review' | 'completed';

function ApprovalCard({
  approval,
  onClaim,
  onRelease,
  isClaiming,
}: {
  approval: RxApproval;
  onClaim: (id: string) => void;
  onRelease: (id: string) => void;
  isClaiming: boolean;
}) {
  const statusColor = STATUS_COLORS[approval.status] || 'bg-warmGrey';

  return (
    <View className="bg-bg-surface rounded-lg border border-border p-md mb-sm">
      <View className="flex-row items-center justify-between mb-xs">
        <Text className="text-headline text-text-primary flex-1" numberOfLines={1}>
          {approval.clientName}
        </Text>
        <View className={`rounded-full px-sm py-xs ${statusColor}`}>
          <Text className="text-captionStrong text-text-primary">
            {STATUS_LABELS[approval.status]}
          </Text>
        </View>
      </View>

      <Text className="text-caption text-text-muted mb-sm">
        Submitted {new Date(approval.submittedAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        })}
        {approval.claimedBy && ` • Claimed by ${approval.claimedBy}`}
      </Text>

      {/* Snapshot summary */}
      {approval.snapshot?.product && (
        <Text className="text-body text-text-muted mb-sm" numberOfLines={1}>
          {approval.snapshot.product.name}
          {approval.snapshot.lensType && ` — ${approval.snapshot.lensType}`}
        </Text>
      )}

      {/* Actions */}
      <View className="flex-row gap-sm mt-sm">
        {approval.status === 'submitted' && (
          <Button
            variant="primary"
            onPress={() => onClaim(approval.id)}
            disabled={isClaiming}
          >
            Claim for Review
          </Button>
        )}
        {approval.status === 'in_review' && (
          <Button variant="ghost" onPress={() => onRelease(approval.id)}>
            Release
          </Button>
        )}
      </View>
    </View>
  );
}

function RxApprovalsContent() {
  const [activeTab, setActiveTab] = useState<TabFilter>('submitted');
  const { data: summary } = useRxApprovalSummary();

  // Map tab to API status filter
  const statusFilter: ApprovalStatus | undefined =
    activeTab === 'completed' ? undefined : activeTab;

  const { data: approvals, isLoading, error, refetch } = useRxApprovalQueue(statusFilter);
  const claimApproval = useClaimApproval();
  const releaseApproval = useReleaseApproval();

  // Heartbeat for claimed items
  const heartbeat = useApprovalHeartbeat();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [claimedId, setClaimedId] = useState<string | null>(null);

  useEffect(() => {
    if (claimedId) {
      heartbeatRef.current = setInterval(() => {
        heartbeat.mutate(claimedId);
      }, 30_000);
    }
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [claimedId]);

  const handleClaim = async (id: string) => {
    try {
      await claimApproval.mutateAsync(id);
      setClaimedId(id);
      toast.success('Claimed', 'You are now reviewing this approval');
    } catch {
      toast.error('Claim failed', 'Another reviewer may have claimed it');
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await releaseApproval.mutateAsync(id);
      setClaimedId(null);
      toast.info('Released', 'Approval returned to queue');
    } catch {
      toast.error('Release failed', 'Please try again');
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Filter completed items client-side
  const displayApprovals = activeTab === 'completed'
    ? (approvals ?? []).filter(a => ['approved', 'rejected', 'returned'].includes(a.status))
    : approvals ?? [];

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-md border-b border-border">
        <Text className="text-displayLg text-text-primary">Rx Approvals</Text>
        {summary && (
          <View className="flex-row gap-md mt-md">
            <View className="items-center">
              <Text className="text-headline text-warning">{summary.submitted}</Text>
              <Text className="text-caption text-text-muted">Pending</Text>
            </View>
            <View className="items-center">
              <Text className="text-headline text-blue">{summary.in_review}</Text>
              <Text className="text-caption text-text-muted">In Review</Text>
            </View>
            <View className="items-center">
              <Text className="text-headline text-green">{summary.approved}</Text>
              <Text className="text-caption text-text-muted">Approved</Text>
            </View>
          </View>
        )}
      </View>

      {/* Tab pills */}
      <View className="flex-row px-xl py-md gap-sm">
        {([
          { key: 'submitted', label: 'Pending' },
          { key: 'in_review', label: 'In Review' },
          { key: 'completed', label: 'Completed' },
        ] as { key: TabFilter; label: string }[]).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`px-md py-sm rounded-full min-h-[44px] justify-center ${
              activeTab === tab.key ? 'bg-navy' : 'border border-border'
            }`}
          >
            <Text className={`text-bodyStrong ${
              activeTab === tab.key ? 'text-white' : 'text-text-primary'
            }`}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Approvals list */}
      {displayApprovals.length === 0 ? (
        <EmptyState
          message={activeTab === 'submitted' ? 'No pending approvals in queue' : 'No completed approvals'}
        />
      ) : (
        <FlatList
          data={displayApprovals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ApprovalCard
              approval={item}
              onClaim={handleClaim}
              onRelease={handleRelease}
              isClaiming={claimApproval.isPending}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

export default function RxApprovalsScreen() {
  return (
    <PermissionGate
      permission="org:rx:verify"
      fallback={
        <View className="flex-1 bg-bg-page items-center justify-center p-xl">
          <FileCheck size={48} color="#6B6B6B" />
          <Text className="text-headline text-text-primary mt-lg">Permission Required</Text>
          <Text className="text-body text-text-muted mt-sm text-center">
            You need Rx verification access to view approvals
          </Text>
        </View>
      }
    >
      <RxApprovalsContent />
    </PermissionGate>
  );
}

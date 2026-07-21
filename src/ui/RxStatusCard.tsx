import { View, Text, Pressable } from 'react-native';
import { ClipboardList, FileCheck, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRxPipelineCounts } from '@/src/api/useRxPipeline';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { PermissionGate } from './PermissionGate';

/**
 * RxStatusCard — shown on Home screen right panel.
 * Displays live badge counts for Rx Pipeline and Approvals.
 * Tapping navigates to the respective screen.
 */
export function RxStatusCard() {
  const router = useRouter();
  const { data: rxCounts } = useRxPipelineCounts();
  const { data: approvalSummary } = useRxApprovalSummary();

  const readyCount = rxCounts?.ready ?? 0;
  const inLabCount = (rxCounts?.ordered ?? 0) + (rxCounts?.in_lab ?? 0);
  const pendingApprovals = approvalSummary?.submitted ?? 0;

  // Only show if user has at least one Rx permission
  const hasAnyData = readyCount > 0 || inLabCount > 0 || pendingApprovals > 0;

  return (
    <PermissionGate permissions={['org:rx-pipeline:read', 'org:rx:verify']}>
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Rx Status
        </Text>

        {/* Pipeline summary */}
        <PermissionGate permission="org:rx-pipeline:read">
          <Pressable
            onPress={() => router.push('/more/rx-pipeline')}
            className="flex-row items-center py-sm min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel={`Rx Pipeline: ${readyCount} ready for pickup, ${inLabCount} in progress`}
          >
            <ClipboardList size={16} color="#6B6B6B" />
            <View className="flex-1 ml-sm">
              <View className="flex-row items-center gap-md">
                {readyCount > 0 && (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-success mr-xs" />
                    <Text className="text-body text-text-primary">{readyCount} ready</Text>
                  </View>
                )}
                {inLabCount > 0 && (
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-warning mr-xs" />
                    <Text className="text-body text-text-muted">{inLabCount} in progress</Text>
                  </View>
                )}
                {readyCount === 0 && inLabCount === 0 && (
                  <Text className="text-body text-text-muted">No active orders</Text>
                )}
              </View>
            </View>
            <ChevronRight size={14} color="#A3A3A3" />
          </Pressable>
        </PermissionGate>

        {/* Approvals summary */}
        <PermissionGate permission="org:rx:verify">
          <Pressable
            onPress={() => router.push('/more/rx-approvals')}
            className="flex-row items-center py-sm border-t border-border min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel={`Rx Approvals: ${pendingApprovals} pending review`}
          >
            <FileCheck size={16} color="#6B6B6B" />
            <View className="flex-1 ml-sm">
              {pendingApprovals > 0 ? (
                <View className="flex-row items-center">
                  <View className="bg-brand rounded-full min-w-[20px] h-5 items-center justify-center px-xs mr-sm">
                    <Text className="text-caption text-brand-text font-medium">{pendingApprovals}</Text>
                  </View>
                  <Text className="text-body text-text-primary">pending review</Text>
                </View>
              ) : (
                <Text className="text-body text-text-muted">No pending approvals</Text>
              )}
            </View>
            <ChevronRight size={14} color="#A3A3A3" />
          </Pressable>
        </PermissionGate>
      </View>
    </PermissionGate>
  );
}

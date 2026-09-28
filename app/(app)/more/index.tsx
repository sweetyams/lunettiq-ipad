import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  Settings,
  ArrowUpDown,
  Palette,
  LogOut,
  ClipboardList,
  FileCheck,
  Award,
  Receipt,
  Users2,
  FileText,
  ChevronRight,
  Store,
} from 'lucide-react-native';
import { useRxPipelineCounts } from '@/src/api/useRxPipeline';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { useTenantStore, type Project } from '@/src/features/tenant/useTenantStore';
import { switchProject } from '@/src/features/tenant/switchProject';
import { useInitialSync } from '@/src/sync/useInitialSync';
import { useSyncStore } from '@/src/sync/useSyncStore';

function MenuRow({
  icon,
  label,
  description,
  badge,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: number;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-lg py-md min-h-[56px] ${isLast ? '' : 'border-b border-border'}`}
      accessibilityRole="button"
      accessibilityLabel={`${label}${badge ? `, ${badge} pending` : ''}`}
    >
      <View className="w-9 h-9 rounded-md bg-bg-muted items-center justify-center mr-md">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-body-md text-text-primary">{label}</Text>
        <Text className="text-caption-md text-text-muted">{description}</Text>
      </View>
      {badge != null && badge > 0 && (
        <View className="bg-brand rounded-full min-w-[24px] h-6 items-center justify-center px-xs mr-sm">
          <Text className="text-caption-md text-brand-text font-medium">{badge}</Text>
        </View>
      )}
      <ChevronRight size={16} color="#A3A3A3" />
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-caption-md font-medium text-text-muted uppercase tracking-wider px-lg pt-xl pb-sm">
      {title}
    </Text>
  );
}

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  const activeProject = useTenantStore((s) => s.activeProject);
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const { startSync } = useInitialSync();
  const canChangeStore = knownProjects.length > 1;

  // Live badge counts — these queries fail gracefully if no permission
  const { data: rxCounts } = useRxPipelineCounts();
  const { data: approvalSummary } = useRxApprovalSummary();

  const readyForPickup = rxCounts?.ready ?? 0;
  const pendingApprovals = approvalSummary?.submitted ?? 0;

  const performChange = async (target: Project): Promise<void> => {
    try {
      await switchProject(target);
      await startSync();
      router.replace('/(app)/home');
    } catch {
      Alert.alert('Could not change store', 'Something went wrong. Please try again.');
    }
  };

  const promptChangeStore = (): void => {
    if (!canChangeStore) return;

    // Guard: warn if there is unsynced local work before tearing down the DB.
    const { pendingWrites, pendingUploads } = useSyncStore.getState();
    const pending = pendingWrites + pendingUploads;

    const proceed = (): void => {
      // Pick the other project when there are exactly two; otherwise send to the picker.
      const others = knownProjects.filter((p) => p.slug !== activeProject?.slug);
      if (others.length === 1) {
        Alert.alert(
          'Change store',
          `Switch to ${others[0]!.name}? This device will reload that store's data.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Switch', style: 'destructive', onPress: () => void performChange(others[0]!) },
          ]
        );
      } else {
        router.push('/select-project');
      }
    };

    if (pending > 0) {
      Alert.alert(
        'Unsynced changes',
        `You have ${pending} change${pending > 1 ? 's' : ''} that haven't synced yet. ` +
          'Changing store now may delay syncing them until you return. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Change anyway', style: 'destructive', onPress: proceed },
        ]
      );
    } else {
      proceed();
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-md">
        <Text className="text-display-lg text-text-primary">More</Text>
        <Text className="text-body-md text-text-muted mt-xs">
          Workflows, tools, and settings
        </Text>
      </View>

      {/* Optical & Rx Section */}
      <SectionHeader title="Optical Workflows" />
      <View className="mx-xl bg-bg-surface rounded-lg border border-border overflow-hidden">
        <MenuRow
          icon={<ClipboardList color="#1A1A1A" size={18} />}
          label="Rx Pipeline"
          description="Track orders from lab to pickup"
          badge={readyForPickup}
          onPress={() => router.push('/more/rx-pipeline')}
        />
        <MenuRow
          icon={<FileCheck color="#1A1A1A" size={18} />}
          label="Rx Approvals"
          description="Review and sign off prescriptions"
          badge={pendingApprovals}
          onPress={() => router.push('/more/rx-approvals')}
        />
        <MenuRow
          icon={<FileText color="#1A1A1A" size={18} />}
          label="Prescriptions"
          description="View and manage Rx records"
          onPress={() => router.push('/more/rx-pipeline')}
          isLast
        />
      </View>

      {/* Sales & Client Tools */}
      <SectionHeader title="Sales Tools" />
      <View className="mx-xl bg-bg-surface rounded-lg border border-border overflow-hidden">
        <MenuRow
          icon={<Users2 color="#1A1A1A" size={18} />}
          label="Multi-Pair"
          description="Recommend multiple frames per lifestyle"
          onPress={() => router.push('/clients')}
        />
        <MenuRow
          icon={<Award color="#1A1A1A" size={18} />}
          label="Loyalty & Credits"
          description="View balances and issue credits (from client profile)"
          onPress={() => router.push('/clients')}
        />
        <MenuRow
          icon={<Receipt color="#1A1A1A" size={18} />}
          label="Insurance Receipts"
          description="Generate and resend receipts (from client profile)"
          onPress={() => router.push('/clients')}
          isLast
        />
      </View>

      {/* Intake & Custom */}
      <SectionHeader title="Intake & Custom" />
      <View className="mx-xl bg-bg-surface rounded-lg border border-border overflow-hidden">
        <MenuRow
          icon={<ArrowUpDown color="#1A1A1A" size={18} />}
          label="Second Sight"
          description="Trade-in intake, grading, and credit"
          onPress={() => router.push('/more/second-sight')}
        />
        <MenuRow
          icon={<Palette color="#1A1A1A" size={18} />}
          label="Custom Designs"
          description="Capture custom frame orders"
          onPress={() => router.push('/more/custom-design')}
          isLast
        />
      </View>

      {/* Store */}
      {activeProject && (
        <>
          <SectionHeader title="Store" />
          <View className="mx-xl bg-bg-surface rounded-lg border border-border overflow-hidden">
            <View className="flex-row items-center px-lg py-md min-h-[56px] border-b border-border">
              <View className="w-9 h-9 rounded-md bg-brand items-center justify-center mr-md">
                {activeProject.brandMark ? (
                  <Text className="text-brand-text text-body-md font-bold">
                    {activeProject.brandMark}
                  </Text>
                ) : (
                  <Store color="#FFFFFF" size={18} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-body-md text-text-primary">{activeProject.name}</Text>
                <Text className="text-caption-md text-text-muted capitalize">
                  {activeProject.env === 'demo' ? 'Demo store · ' : ''}
                  {activeProject.role}
                </Text>
              </View>
            </View>
            {canChangeStore ? (
              <MenuRow
                icon={<ArrowUpDown color="#1A1A1A" size={18} />}
                label="Change store"
                description="Switch to another store you have access to"
                onPress={promptChangeStore}
                isLast
              />
            ) : (
              <View className="px-lg py-md">
                <Text className="text-caption-md text-text-muted">
                  This is the only store you have access to.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* System */}
      <SectionHeader title="System" />
      <View className="mx-xl bg-bg-surface rounded-lg border border-border overflow-hidden">
        <MenuRow
          icon={<Settings color="#1A1A1A" size={18} />}
          label="Settings"
          description="Sync, device config, account"
          onPress={() => router.push('/more/settings')}
          isLast
        />
      </View>

      {/* Sign out */}
      <View className="mx-xl mt-xl mb-2xl">
        <Pressable
          onPress={() => signOut()}
          className="flex-row items-center justify-center px-lg py-md rounded-lg border border-border min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut color="#DC2626" size={18} />
          <Text className="text-body-md text-destructive ml-md">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

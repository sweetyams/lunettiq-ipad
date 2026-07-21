import { View, Text, Pressable, ScrollView } from 'react-native';
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
} from 'lucide-react-native';
import { useRxPipelineCounts } from '@/src/api/useRxPipeline';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';

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
        <Text className="text-body text-text-primary">{label}</Text>
        <Text className="text-caption text-text-muted">{description}</Text>
      </View>
      {badge != null && badge > 0 && (
        <View className="bg-brand rounded-full min-w-[24px] h-6 items-center justify-center px-xs mr-sm">
          <Text className="text-caption text-brand-text font-medium">{badge}</Text>
        </View>
      )}
      <ChevronRight size={16} color="#A3A3A3" />
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-captionStrong text-text-muted uppercase tracking-wider px-lg pt-xl pb-sm">
      {title}
    </Text>
  );
}

export default function MoreScreen() {
  const { signOut } = useAuth();
  const router = useRouter();

  // Live badge counts — these queries fail gracefully if no permission
  const { data: rxCounts } = useRxPipelineCounts();
  const { data: approvalSummary } = useRxApprovalSummary();

  const readyForPickup = rxCounts?.ready ?? 0;
  const pendingApprovals = approvalSummary?.submitted ?? 0;

  return (
    <ScrollView className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-md">
        <Text className="text-displayLg text-text-primary">More</Text>
        <Text className="text-body text-text-muted mt-xs">
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
          <Text className="text-body text-destructive ml-md">Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

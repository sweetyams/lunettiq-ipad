import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  User,
  Settings,
  LogOut,
  ArrowUpDown,
  Palette,
  ClipboardList,
  FileCheck,
  ChevronRight,
  Bell,
  Shield,
  Store,
} from 'lucide-react-native';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { SyncIndicator } from '@/src/ui/SyncIndicator';
import { useTenantStore, type Project } from '@/src/features/tenant/useTenantStore';
import { switchProject } from '@/src/features/tenant/switchProject';
import { useInitialSync } from '@/src/sync/useInitialSync';
import { useSyncStore } from '@/src/sync/useSyncStore';

/**
 * Profile screen — User identity, settings, and secondary navigation.
 *
 * Replaces the old "More" tab. Consolidates:
 * - User identity + avatar
 * - Notification preferences
 * - Settings navigation
 * - Secondary feature access (Second Sight, Custom Design, Rx Pipeline, etc.)
 * - Sign out
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { activeOperator } = useOperatorStore();

  const activeProject = useTenantStore((s) => s.activeProject);
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const { startSync } = useInitialSync();
  const canChangeStore = knownProjects.length > 1;

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

    const { pendingWrites, pendingUploads } = useSyncStore.getState();
    const pending = pendingWrites + pendingUploads;

    const proceed = (): void => {
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

  const displayName = activeOperator?.name ?? user?.fullName ?? 'Staff Member';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const role = activeOperator?.role ?? 'sales_associate';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView className="flex-1 bg-bg-page" contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Profile header */}
      <View className="items-center pt-xl pb-lg border-b border-border mx-lg">
        {/* Avatar circle */}
        <View className="w-[72px] h-[72px] rounded-full bg-brand items-center justify-center mb-md">
          <Text className="text-brand-text text-[24px] font-semibold">
            {initials}
          </Text>
        </View>
        <Text className="text-text-primary text-heading-lg font-medium">
          {displayName}
        </Text>
        <Text className="text-text-secondary text-body-sm mt-xs">
          {email}
        </Text>
        <View className="mt-sm px-md py-xs rounded-full bg-bg-muted">
          <Text className="text-text-muted text-caption-md capitalize">
            {role.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Sync status */}
      <View className="mx-lg mt-lg">
        <SyncIndicator />
      </View>

      {/* Store */}
      {activeProject && (
        <View className="mx-lg mt-lg">
          <Text className="text-text-muted text-caption-md uppercase tracking-wider mb-sm px-sm">
            Store
          </Text>
          <View className="bg-bg-surface rounded-lg border border-border overflow-hidden">
            <View className="flex-row items-center px-md py-md min-h-[52px] border-b border-border">
              <View className="w-[36px] h-[36px] rounded-md bg-brand items-center justify-center">
                {activeProject.brandMark ? (
                  <Text className="text-brand-text text-body-md font-bold">
                    {activeProject.brandMark}
                  </Text>
                ) : (
                  <Store size={20} color="#FFFFFF" />
                )}
              </View>
              <View className="flex-1 ml-md">
                <Text className="text-text-primary text-body-md font-medium">
                  {activeProject.name}
                </Text>
                <Text className="text-text-muted text-caption-md capitalize">
                  {activeProject.env === 'demo' ? 'Demo store · ' : ''}
                  {activeProject.role}
                </Text>
              </View>
            </View>
            {canChangeStore ? (
              <MenuRow
                icon={<ArrowUpDown size={20} color="#737373" />}
                label="Change store"
                description="Switch to another store you have access to"
                onPress={promptChangeStore}
                isLast
              />
            ) : (
              <View className="px-md py-md">
                <Text className="text-text-muted text-caption-md">
                  This is the only store you have access to.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Navigation sections */}
      <View className="mx-lg mt-lg">
        <Text className="text-text-muted text-caption-md uppercase tracking-wider mb-sm px-sm">
          Tools
        </Text>
        <View className="bg-bg-surface rounded-lg border border-border overflow-hidden">
          <MenuRow
            icon={<ArrowUpDown size={20} color="#737373" />}
            label="Second Sight"
            description="Trade-in intake"
            onPress={() => router.push('/(app)/more/second-sight')}
          />
          <MenuRow
            icon={<Palette size={20} color="#737373" />}
            label="Custom Design"
            description="Design capture"
            onPress={() => router.push('/(app)/more/custom-design')}
          />
          <MenuRow
            icon={<ClipboardList size={20} color="#737373" />}
            label="Rx Pipeline"
            description="Prescription orders"
            onPress={() => router.push('/(app)/more/rx-pipeline')}
          />
          <MenuRow
            icon={<FileCheck size={20} color="#737373" />}
            label="Rx Approvals"
            description="Review queue"
            onPress={() => router.push('/(app)/more/rx-approvals')}
            isLast
          />
        </View>
      </View>

      <View className="mx-lg mt-lg">
        <Text className="text-text-muted text-caption-md uppercase tracking-wider mb-sm px-sm">
          Preferences
        </Text>
        <View className="bg-bg-surface rounded-lg border border-border overflow-hidden">
          <MenuRow
            icon={<Bell size={20} color="#737373" />}
            label="Notifications"
            description="Push & in-app alerts"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Shield size={20} color="#737373" />}
            label="Privacy & Security"
            description="Lock timeout, biometrics"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Settings size={20} color="#737373" />}
            label="Settings"
            description="App configuration"
            onPress={() => router.push('/(app)/more/settings')}
            isLast
          />
        </View>
      </View>

      {/* Sign out */}
      <View className="mx-lg mt-lg">
        <Pressable
          onPress={() => signOut()}
          className="flex-row items-center justify-center py-md bg-bg-surface rounded-lg border border-border min-h-[52px]"
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut size={18} color="#B42318" />
          <Text className="text-error text-body-md font-medium ml-sm">
            Sign out
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

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
      className={`flex-row items-center px-md py-md min-h-[52px] ${
        !isLast ? 'border-b border-border' : ''
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <View className="w-[36px] h-[36px] rounded-md bg-bg-muted items-center justify-center">
        {icon}
      </View>
      <View className="flex-1 ml-md">
        <Text className="text-text-primary text-body-md font-medium">{label}</Text>
        <Text className="text-text-muted text-caption-md">{description}</Text>
      </View>
      {badge != null && badge > 0 && (
        <View className="mr-sm min-w-[20px] h-[20px] rounded-full bg-error items-center justify-center px-[4px]">
          <Text className="text-[11px] font-bold text-text-inverse">{badge}</Text>
        </View>
      )}
      <ChevronRight size={16} color="#A3A3A3" />
    </Pressable>
  );
}

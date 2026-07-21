import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Package, AlertCircle } from 'lucide-react-native';
import { useActiveHolds } from '@/src/api/useAppointments';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import type { InventoryHold } from '@/src/api/appointments.types';

interface ActiveHoldsCardProps {
  onHoldPress?: (hold: InventoryHold) => void;
}

export function ActiveHoldsCard({ onHoldPress }: ActiveHoldsCardProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: holds, isLoading, error, refetch } = useActiveHolds();

  // Hide entirely in client-visible mode (inventory is staff-only)
  if (privacyMode === 'client') return null;

  if (isLoading) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Active Holds
        </Text>
        <View className="items-center py-md">
          <ActivityIndicator color="#737373" size="small" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Active Holds
        </Text>
        <View className="items-center py-md">
          <AlertCircle color="#DC2626" size={20} />
          <Text className="text-caption text-text-muted mt-sm">Failed to load holds</Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-sm min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Retry loading holds"
          >
            <Text className="text-caption text-text-primary font-medium">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!holds || holds.length === 0) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Active Holds
        </Text>
        <View className="items-center py-md">
          <Package color="#A3A3A3" size={20} />
          <Text className="text-caption text-text-muted mt-sm">No active holds</Text>
        </View>
      </View>
    );
  }

  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60)));

    if (hoursLeft < 1) return 'Expiring soon';
    if (hoursLeft < 24) return `${hoursLeft}h left`;
    const days = Math.round(hoursLeft / 24);
    return `${days}d left`;
  };

  return (
    <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
      <View className="flex-row items-center justify-between mb-md">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider">
          Active Holds
        </Text>
        <View className="bg-brand rounded-full px-sm py-xs">
          <Text className="text-captionStrong text-brand-text">{holds.length}</Text>
        </View>
      </View>

      {holds.map((hold) => (
        <Pressable
          key={hold.id}
          onPress={() => onHoldPress?.(hold)}
          className="flex-row items-center py-sm border-b border-border last:border-b-0 min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel={`${hold.productName}, ${formatExpiry(hold.expiresAt)}`}
        >
          <Package color="#737373" size={16} />
          <View className="flex-1 ml-sm">
            <Text className="text-body text-text-primary" numberOfLines={1}>
              {hold.productName}
            </Text>
            {hold.variantTitle && (
              <Text className="text-caption text-text-muted" numberOfLines={1}>
                {hold.variantTitle}
              </Text>
            )}
          </View>
          <Text className="text-caption text-warning ml-sm">
            {formatExpiry(hold.expiresAt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

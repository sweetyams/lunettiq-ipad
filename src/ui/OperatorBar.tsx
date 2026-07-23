import { View, Text, Pressable } from 'react-native';
import { Lock, User } from 'lucide-react-native';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { useAuthContext } from '@/src/features/auth/AuthProvider';

/**
 * OperatorBar — always-visible bar showing who is currently operating the device.
 * 
 * Shows:
 * - Operator name (or "Device owner" if no switch)
 * - Role badge
 * - Quick lock button (🔒) to trigger PIN/Face ID switch
 *
 * Renders below ModeStrip, above all content. Only hidden when locked.
 */
export function OperatorBar() {
  const { activeOperator, deviceOwnerId } = useOperatorStore();
  const { isLocked, lock } = useAuthContext();

  // Don't render when locked (lock screen is showing)
  if (isLocked) return null;

  // Determine display name
  const operatorName = activeOperator?.name ?? null;
  const operatorRole = activeOperator?.role ?? null;
  const isSwitched = activeOperator !== null && activeOperator.clerkUserId !== deviceOwnerId;

  return (
    <View className="flex-row h-[36px] items-center px-lg bg-color-bg-elevated border-b border-color-border">
      {/* Left: Operator identity */}
      <View className="flex-row items-center flex-1">
        <User size={14} color="#737373" />
        <Text className="text-body-sm text-color-text-secondary ml-sm" numberOfLines={1}>
          {operatorName ?? 'No operator'}
        </Text>
        {operatorRole && (
          <View className="ml-sm px-sm py-[1px] rounded-full bg-color-bg-muted">
            <Text className="text-caption-xs text-color-text-muted capitalize">
              {operatorRole}
            </Text>
          </View>
        )}
        {isSwitched && (
          <View className="ml-sm px-sm py-[1px] rounded-full bg-color-brand">
            <Text className="text-caption-xs text-color-brand-text">
              Switched
            </Text>
          </View>
        )}
      </View>

      {/* Right: Quick lock button */}
      <Pressable
        onPress={lock}
        accessibilityRole="button"
        accessibilityLabel="Lock device and switch user"
        className="flex-row items-center min-h-[36px] min-w-[44px] px-sm justify-center gap-xs"
      >
        <Lock size={14} color="#737373" />
        <Text className="text-body-sm text-color-text-muted">
          Lock
        </Text>
      </Pressable>
    </View>
  );
}

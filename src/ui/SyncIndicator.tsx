import { View, Text, Pressable } from 'react-native';
import { useSyncStore } from '@/src/sync/SyncProvider';

export function SyncIndicator() {
  const { isOnline, pendingWrites } = useSyncStore();

  const getStatus = () => {
    if (!isOnline) return { color: 'bg-error', label: 'Offline' };
    if (pendingWrites > 0) return { color: 'bg-warning', label: `${pendingWrites} pending` };
    return { color: 'bg-accent', label: 'Synced' };
  };

  const status = getStatus();

  return (
    <Pressable 
      className="min-w-[44px] min-h-[44px] items-center justify-center"
      accessibilityLabel={`Sync status: ${status.label}`}
      accessibilityRole="button"
    >
      <View className="flex-row items-center">
        <View className={`w-[9px] h-[9px] rounded-full ${status.color}`} />
        {pendingWrites > 0 && (
          <View className="absolute -top-1 -right-1 bg-warning rounded-full min-w-[16px] px-1 items-center justify-center">
            <Text className="text-text-inverse text-[10px] font-medium">
              {pendingWrites}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
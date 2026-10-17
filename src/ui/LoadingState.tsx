import { View, Text, ActivityIndicator } from 'react-native';
import { kitColors } from '@/src/ui/kit/colors';

/** Quiet, centred spinner with an optional label. No grey skeleton slabs. */
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-[12px] py-[48px]" accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={kitColors.textTertiary} />
      <Text className="text-body-sm text-text-tertiary">{label}</Text>
    </View>
  );
}

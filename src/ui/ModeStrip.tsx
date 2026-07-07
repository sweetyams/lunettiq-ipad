import { View, Text } from 'react-native';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

export function ModeStrip() {
  const mode = usePrivacyStore((state) => state.mode);

  if (mode === 'staff') {
    return <View className="h-[2px] bg-navy w-full" />;
  }

  return (
    <View className="h-[22px] bg-green w-full items-center justify-center">
      <Text className="text-white text-captionStrong uppercase tracking-wider">
        CLIENT VIEW
      </Text>
    </View>
  );
}
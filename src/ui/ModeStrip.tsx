import { View, Text } from 'react-native';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

/**
 * Privacy mode indicator strip at the very top of the screen.
 *
 * Staff mode:   2px brand-colored strip (barely visible, professional)
 * Client mode:  24px green strip with "CLIENT VIEW — double-tap with two fingers to exit"
 * Handed mode:  Same as client mode (locked, only exit gesture works)
 */
export function ModeStrip() {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Staff mode — thin brand strip
  if (privacyMode === 'staff' && !handedToClient) {
    return <View className="h-[2px] bg-mode-staff w-full" />;
  }

  // Client-visible or handed — green strip with label
  return (
    <View className="h-[24px] bg-mode-client w-full items-center justify-center">
      <Text className="text-text-inverse text-caption-md tracking-[0.16em] uppercase">
        Client view — double-tap with two fingers to exit
      </Text>
    </View>
  );
}

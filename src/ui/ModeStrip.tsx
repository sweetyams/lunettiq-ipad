import { View, Text } from 'react-native';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

/**
 * Privacy mode indicator strip at the very top of the screen.
 *
 * Staff mode:   nothing (default state)
 * Client mode:  soft success bar "Client view · staff details hidden"
 * Handed mode:  nothing — HandedToClientView has its own staff-only exit bar,
 *               and the client shouldn't be shown how to leave.
 */
export function ModeStrip() {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Staff mode is the normal state: no marker (the Builder doesn't mark its default mode).
  if (handedToClient || privacyMode === 'staff') return null;

  // Client-visible or handed: privacy must be unmistakable, so keep a full-width bar,
  // in Found UI's soft success style rather than a solid colour band.
  return (
    <View className="min-h-[32px] bg-success-soft border-b border-success-ring w-full flex-row items-center justify-center gap-[8px]">
      <View className="w-[8px] h-[8px] rounded-full bg-success" />
      <Text className="text-success text-body-sm font-medium">
        Client view · staff details hidden
      </Text>
    </View>
  );
}

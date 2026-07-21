import { View, Text } from 'react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

export function ModeStrip() {
  const mode = useSessionStore((s) => s.mode);
  const privacyMode = usePrivacyStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Staff mode - 2pt navy strip
  if (privacyMode === 'staff' && !handedToClient) {
    return <View className="h-[2px] bg-brand w-full" />;
  }

  // Client-visible mode - 6pt green strip
  if (privacyMode === 'client' && !handedToClient) {
    return (
      <View className="h-[24px] bg-accent w-full items-center justify-center">
        <Text className="text-text-inverse text-xs font-medium uppercase tracking-wider">
          CLIENT VIEW
        </Text>
      </View>
    );
  }

  // Handed to client - 6pt green strip with different text
  if (handedToClient) {
    return (
      <View className="h-[24px] bg-accent w-full items-center justify-center">
        <Text className="text-text-inverse text-xs font-medium uppercase tracking-wider">
          HANDED TO CLIENT
        </Text>
      </View>
    );
  }

  // Fallback - should not happen
  return <View className="h-[2px] bg-brand w-full" />;
}
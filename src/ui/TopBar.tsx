import { View, Text } from 'react-native';
import { SyncIndicator } from './SyncIndicator';
import { PrivacyToggle } from './PrivacyToggle';

interface TopBarProps {
  title?: string;
  showPrivacyToggle?: boolean;
  showSyncIndicator?: boolean;
  sessionChip?: {
    clientName: string;
    duration: string;
  } | null;
}

export function TopBar({ 
  title, 
  showPrivacyToggle = true, 
  showSyncIndicator = true, 
  sessionChip 
}: TopBarProps) {
  return (
    <View className="flex-row h-[60px] items-center px-xl bg-white/90 border-b border-warmGrey">
      {/* Left: Title */}
      <View className="flex-row items-center">
        {title && (
          <Text className="text-headline font-bold text-charcoal">
            {title}
          </Text>
        )}
      </View>

      {/* Center: Spacer */}
      <View className="flex-1" />

      {/* Right: Session chip + Sync + Privacy */}
      <View className="flex-row items-center gap-2">
        {sessionChip && (
          <View className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-white border border-warmGrey">
            <View className="w-2 h-2 rounded-full bg-green" />
            <Text className="text-body text-charcoal">
              Session · {sessionChip.clientName} · {sessionChip.duration}
            </Text>
          </View>
        )}
        
        {showSyncIndicator && <SyncIndicator />}
        {showPrivacyToggle && <PrivacyToggle />}
      </View>
    </View>
  );
}
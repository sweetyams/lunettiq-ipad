import { View, Text, Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SyncIndicator } from './SyncIndicator';
import { PrivacyToggle } from './PrivacyToggle';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface TopBarProps {
  title?: string;
  showPrivacyToggle?: boolean;
  showSyncIndicator?: boolean;
  sessionChip?: {
    clientName: string;
    duration: string;
  } | null;
  variant?: 'full' | 'minimal' | 'hidden';
  onExit?: () => void;
  photoCount?: number;
}

export function TopBar({ 
  title, 
  showPrivacyToggle = true, 
  showSyncIndicator = true, 
  sessionChip,
  variant = 'full',
  onExit,
  photoCount
}: TopBarProps) {
  const mode = useSessionStore((s) => s.mode);
  const activeClientName = useSessionStore((s) => s.activeClientName);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Auto-determine variant based on state if not explicitly provided
  let effectiveVariant = variant;
  if (variant === 'full') {
    if (handedToClient) {
      effectiveVariant = 'hidden';
    } else if (mode === 'fitting') {
      effectiveVariant = 'minimal';
    }
  }

  // Hidden variant - render nothing
  if (effectiveVariant === 'hidden') {
    return null;
  }

  // Minimal variant - fitting mode chrome
  if (effectiveVariant === 'minimal') {
    return (
      <View className="flex-row h-[60px] items-center px-lg bg-black/80 backdrop-blur">
        {/* Left: Exit button */}
        <Pressable 
          onPress={onExit}
          className="flex-row items-center gap-2 min-w-[44px] min-h-[44px] justify-center"
          accessibilityRole="button"
          accessibilityLabel="Exit fitting mode"
        >
          <ChevronLeft color="#FFFFFF" size={24} />
        </Pressable>

        {/* Center: Client name */}
        <View className="flex-1 items-center">
          {activeClientName && (
            <Text className="text-text-inverse text-body font-medium">
              {activeClientName}
            </Text>
          )}
        </View>

        {/* Right: Photo count */}
        <View className="min-w-[44px] items-center">
          {typeof photoCount === 'number' && (
            <Text className="text-text-inverse/70 text-caption">
              {photoCount}/20
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Full variant - default TopBar
  return (
    <View className="flex-row h-[60px] items-center px-xl bg-bg-elevated/90 border-b border-border">
      {/* Left: Title */}
      <View className="flex-row items-center">
        {title && (
          <Text className="text-headline font-bold text-text-primary">
            {title}
          </Text>
        )}
      </View>

      {/* Center: Spacer */}
      <View className="flex-1" />

      {/* Right: Session chip + Sync + Privacy */}
      <View className="flex-row items-center gap-2">
        {sessionChip && (
          <View className="flex-row items-center gap-2 px-3 py-2 rounded-full bg-bg-elevated border border-border">
            <View className="w-2 h-2 rounded-full bg-accent" />
            <Text className="text-body text-text-primary">
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
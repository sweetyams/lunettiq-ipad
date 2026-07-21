import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  /** Screen title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Show back button (default: true for stack screens) */
  showBack?: boolean;
  /** Custom back handler (defaults to router.back()) */
  onBack?: () => void;
  /** Right-side action slot */
  rightAction?: React.ReactNode;
}

/**
 * Standard screen header with back navigation.
 * Use on all stack-pushed screens (not tab roots).
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center px-xl pt-xl pb-md border-b border-border min-h-[56px]">
      {/* Back button */}
      {showBack && (
        <Pressable
          onPress={handleBack}
          className="w-[44px] h-[44px] items-center justify-center mr-sm -ml-sm"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
      )}

      {/* Title */}
      <View className="flex-1">
        <Text className="text-displayMd text-text-primary">{title}</Text>
        {subtitle && (
          <Text className="text-caption text-text-muted mt-xs">{subtitle}</Text>
        )}
      </View>

      {/* Right action */}
      {rightAction}
    </View>
  );
}

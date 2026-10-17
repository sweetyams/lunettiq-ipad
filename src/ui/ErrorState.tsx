import { View, Text } from 'react-native';
import { AlertCircle, WifiOff } from 'lucide-react-native';
import { Button } from '@/src/ui/kit/Button';
import { kitColors } from '@/src/ui/kit/colors';
import { describeError } from '@/src/ui/kit/states';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

/** Something failed: what happened in plain words, and Try again. Raw messages only in dev. */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { title, message } = describeError(error);
  const offline = title === 'You’re offline';
  const Icon = offline ? WifiOff : AlertCircle;
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
  return (
    <View className="flex-1 items-center justify-center px-[32px] py-[48px]" accessibilityLiveRegion="polite">
      <View className="max-w-[440px] items-center gap-[12px]">
        <View className="w-[48px] h-[48px] rounded-full border border-border items-center justify-center">
          <Icon size={22} color={offline ? kitColors.iconMuted : kitColors.danger} strokeWidth={1.75} />
        </View>
        <Text className="text-heading-lg text-text-primary text-center">{title}</Text>
        <Text className="text-body-md text-text-tertiary text-center">{message}</Text>
        {__DEV__ && raw ? <Text className="text-body-sm text-text-dim text-center">{raw}</Text> : null}
        {onRetry ? <View className="mt-[4px]"><Button label="Try again" onPress={onRetry} /></View> : null}
      </View>
    </View>
  );
}

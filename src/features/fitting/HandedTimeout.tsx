import { View, Text } from 'react-native';
import { Wordmark } from '@/src/ui/Wordmark';
import { Button } from '@/src/ui/kit';
import { useT } from '@/src/i18n';

interface HandedTimeoutProps {
  onReclaim: () => void;
}

/** After 10 minutes in the client's hands: ask them to pass the iPad back. */
export function HandedTimeout({ onReclaim }: HandedTimeoutProps) {
  const tr = useT('client');
  return (
    <View className="flex-1 bg-bg-page items-center justify-center px-[32px] gap-[16px]">
      <Wordmark size="md" />
      <Text className="text-display-lg text-text-primary text-center mt-[24px]">{tr('timeout.thanks')}</Text>
      <Text className="text-body-lg text-text-tertiary text-center max-w-[520px]">{tr('timeout.handBack')}</Text>
      <View className="mt-[24px]">
        <Button label={tr('timeout.staffTakeBack')} onPress={onReclaim} size="lg" />
      </View>
    </View>
  );
}

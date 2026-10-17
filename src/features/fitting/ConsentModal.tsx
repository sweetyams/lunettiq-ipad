import { View, Text } from 'react-native';
import { Sheet } from '@/src/ui/kit';

interface ConsentModalProps {
  isVisible: boolean;
  clientName: string;
  onConsent: (granted: boolean) => void;
}

/** Asked before the first fitting photo. Closing it means no photos. */
export function ConsentModal({ isVisible, clientName, onConsent }: ConsentModalProps) {
  const first = clientName.split(' ')[0] || 'the client';
  return (
    <Sheet
      visible={isVisible}
      onClose={() => onConsent(false)}
      title="Photos today?"
      subtitle={`Ask ${first} before taking any.`}
      secondary={{ label: 'No photos today', onPress: () => onConsent(false) }}
      primary={{ label: `${first} agrees`, onPress: () => onConsent(true) }}
    >
      <View className="gap-[12px]">
        <Text className="text-body-lg text-text-primary">
          “Can we take a few photos of you in the frames? They help you compare, and we can email you your favourites.”
        </Text>
        <Text className="text-body-sm text-text-tertiary">
          Photos are saved to their profile and can be deleted any time. Without consent, keep logging frames and reactions in the visit tray.
        </Text>
      </View>
    </Sheet>
  );
}

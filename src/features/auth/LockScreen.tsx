import { View, Text, Pressable } from 'react-native';
import { useBiometric } from './useBiometric';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const { authenticate } = useBiometric();

  const handlePress = async () => {
    const success = await authenticate('Unlock Lunettiq');
    if (success) {
      onUnlock();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="absolute inset-0 bg-brand flex-1 justify-center items-center"
      accessibilityRole="button"
      accessibilityLabel="Tap to unlock"
    >
      <View className="items-center">
        <Text className="text-text-inverse text-displayLg font-bold mb-xl">
          Lunettiq
        </Text>
        <Text className="text-text-inverse text-body opacity-80">
          Tap to unlock
        </Text>
      </View>
    </Pressable>
  );
}
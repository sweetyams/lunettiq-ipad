import { View, Text, Pressable, Image } from 'react-native';
import { Hand } from 'lucide-react-native';

interface HandedTimeoutProps {
  onReclaim: () => void;
}

export function HandedTimeout({ onReclaim }: HandedTimeoutProps) {
  return (
    <View className="flex-1 bg-bg-page items-center justify-center px-xl">
      {/* Lunettiq Logo Placeholder */}
      <View className="w-32 h-16 bg-brand rounded-lg items-center justify-center mb-xl">
        <Text className="text-text-inverse text-headline font-bold">LUNETTIQ</Text>
      </View>
      
      {/* Main Message */}
      <View className="items-center mb-2xl max-w-lg">
        <Hand size={48} color="#005D23" className="mb-lg" />
        
        <Text className="text-displayMd text-text-primary font-bold text-center mb-md">
          Pass back to staff
        </Text>
        
        <Text className="text-body text-text-muted text-center leading-relaxed">
          The iPad has been in client mode for 10 minutes. Please return it to a staff member to continue.
        </Text>
      </View>
      
      {/* Reclaim Button */}
      <Pressable
        onPress={onReclaim}
        className="bg-brand px-2xl py-lg rounded-lg min-h-[44px] items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Staff authentication required"
        accessibilityHint="Double-tap to authenticate as staff member"
      >
        <Text className="text-text-inverse text-bodyStrong">
          Staff Authentication
        </Text>
      </Pressable>
      
      {/* Helper Text */}
      <Text className="text-caption text-text-muted text-center mt-lg max-w-sm">
        Staff members can also double-tap the top edge of the screen to authenticate.
      </Text>
    </View>
  );
}
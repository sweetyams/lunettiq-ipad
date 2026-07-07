import { View, Text, Modal, Pressable } from 'react-native';
import { Button } from '@/src/ui/Button';

interface ConsentModalProps {
  isVisible: boolean;
  clientName: string;
  onConsent: (granted: boolean) => void;
}

export function ConsentModal({ isVisible, clientName, onConsent }: ConsentModalProps) {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View className="bg-white rounded-lg p-xl max-w-md w-full">
          <Text className="text-displayMd text-charcoal font-bold mb-lg text-center">
            Photo Consent
          </Text>
          
          <Text className="text-body text-charcoal mb-xl text-center leading-relaxed">
            Can we take and save photos of {clientName} trying on frames today? 
            Photos help with comparison and will be saved to their profile.
          </Text>
          
          <View className="flex-row gap-md">
            <Button 
              variant="ghost" 
              onPress={() => onConsent(false)}
            >
              No photos this session
            </Button>
            
            <Button 
              variant="primary" 
              onPress={() => onConsent(true)}
            >
              Client agrees
            </Button>
          </View>
          
          <Text className="text-caption text-midGrey mt-lg text-center">
            Photos can be deleted at any time from the client profile
          </Text>
        </View>
      </View>
    </Modal>
  );
}
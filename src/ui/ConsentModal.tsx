import { View, Text, Pressable, Modal } from 'react-native';

interface ConsentModalProps {
  visible: boolean;
  clientName: string;
  onConsent: () => void;
  onDecline: () => void;
}

export function ConsentModal({ visible, clientName, onConsent, onDecline }: ConsentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="bg-white rounded-lg p-6 w-full max-w-md">
          {/* Title */}
          <Text className="text-displayMd font-bold text-charcoal text-center mb-4">
            Photo consent
          </Text>

          {/* Body */}
          <Text className="text-body text-charcoal text-center mb-6 leading-6">
            Can we save photos of today's fitting to {clientName}'s account? We ask every visit.
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onConsent}
              className="flex-1 bg-green rounded-md py-3 px-4 min-h-[44px] items-center justify-center"
            >
              <Text className="text-white text-bodyStrong">Client agrees</Text>
            </Pressable>

            <Pressable
              onPress={onDecline}
              className="flex-1 bg-navy rounded-md py-3 px-4 min-h-[44px] items-center justify-center"
            >
              <Text className="text-white text-bodyStrong">No photos this session</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
import { Modal, View, Pressable, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { EndSessionFlow } from './EndSessionFlow';

interface EndSessionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function EndSessionSheet({ visible, onClose }: EndSessionSheetProps) {
  const handleBackdropPress = () => {
    // Allow dismissing by tapping backdrop (with confirmation in future)
    onClose();
  };

  const handleComplete = () => {
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-brand/40 items-center justify-center p-lg"
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close end session dialog"
      >
        {/* Modal content */}
        <Pressable 
          className="bg-bg-page rounded-lg w-full max-w-[600px] max-h-[85%] shadow-lg"
          onPress={(e) => e.stopPropagation()} // Prevent backdrop dismiss when tapping content
          accessibilityRole="none"
        >
          {/* Header with close button */}
          <View className="flex-row items-center justify-between p-lg border-b border-border">
            <Text className="text-headline font-semibold text-text-primary">
              End Session
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              accessibilityRole="button"
              className="w-11 h-11 items-center justify-center rounded-md bg-bg-elevated border border-border"
            >
              <X size={20} color="#2B2B2B" />
            </Pressable>
          </View>

          {/* Content area */}
          <View className="flex-1">
            <EndSessionFlow 
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
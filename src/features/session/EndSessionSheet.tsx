import { Modal, View, Pressable } from 'react-native';
import { EndSessionFlow } from './EndSessionFlow';

interface EndSessionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function EndSessionSheet({ visible, onClose }: EndSessionSheetProps) {
  const handleBackdropPress = () => {
    // Allow dismissing by tapping backdrop
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
    >
      <Pressable 
        className="flex-1 bg-navy/30 items-center justify-center p-lg"
        onPress={handleBackdropPress}
      >
        <Pressable 
          className="bg-white rounded-lg w-full max-w-[600px] max-h-[80%]"
          onPress={(e) => e.stopPropagation()} // Prevent backdrop dismiss when tapping content
        >
          <EndSessionFlow 
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
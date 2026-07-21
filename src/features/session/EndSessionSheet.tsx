import { Modal, View, Pressable, Text } from 'react-native';
import { X } from 'lucide-react-native';
import { EndSessionFlow } from './EndSessionFlow';

interface EndSessionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onComplete: () => void;
}

export function EndSessionSheet({ visible, onDismiss, onComplete }: EndSessionSheetProps) {
  const handleBackdropPress = () => {
    // Backdrop press dismisses (cancels) without ending session
    onDismiss();
  };

  const handleXButtonPress = () => {
    // X button dismisses (cancels) without ending session
    onDismiss();
  };

  const handleFlowComplete = () => {
    // EndSessionFlow completed successfully - end session and navigate
    onComplete();
  };

  const handleFlowCancel = () => {
    // EndSessionFlow was cancelled - dismiss without ending session
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-brand/40 items-center justify-center p-lg"
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close end session dialog"
      >
        {/* Modal content - fix layout to be flex container with proper scrolling */}
        <View 
          className="bg-bg-page rounded-lg w-full max-w-[600px] max-h-[85%] shadow-lg flex overflow-hidden"
        >
          {/* Header with close button */}
          <View className="flex-row items-center justify-between p-lg border-b border-border">
            <Text className="text-headline font-semibold text-text-primary">
              End Session
            </Text>
            <Pressable
              onPress={handleXButtonPress}
              accessibilityLabel="Close"
              accessibilityRole="button"
              className="w-11 h-11 items-center justify-center rounded-md bg-bg-elevated border border-border"
            >
              <X size={20} color="#2B2B2B" />
            </Pressable>
          </View>

          {/* Content area - prevent backdrop tap propagation and allow flex-1 */}
          <Pressable 
            className="flex-1"
            onPress={(e) => e.stopPropagation()}
            accessibilityRole="none"
          >
            <EndSessionFlow 
              onComplete={handleFlowComplete}
              onCancel={handleFlowCancel}
            />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  wide = false,
  children,
  footer,
  headerRight,
}: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-bg-overlay items-center justify-start pt-[44px]">
        <View
          className={`bg-bg-page rounded-lg max-h-[784px] overflow-hidden ${
            wide ? 'w-[880px]' : 'w-[720px]'
          }`}
        >
          {/* Head */}
          <View className="flex-row items-center justify-between gap-md px-lg py-lg border-b border-border">
            <View>
              <Text className="text-heading-lg text-text-primary">{title}</Text>
              {subtitle && (
                <Text className="text-body-sm text-text-muted mt-xs">{subtitle}</Text>
              )}
            </View>
            {headerRight || (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="w-[36px] h-[36px] rounded-full bg-bg-muted items-center justify-center"
                hitSlop={8}
              >
                <X size={18} color="rgba(29,31,33,0.65)" />
              </Pressable>
            )}
          </View>

          {/* Body */}
          <ScrollView className="px-lg py-lg" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {/* Foot */}
          {footer && (
            <View className="flex-row items-center justify-between gap-md px-lg py-md border-t border-border bg-bg-page">
              {footer}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
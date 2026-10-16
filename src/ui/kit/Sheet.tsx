import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { Modal } from '@/src/ui/Modal';
import { Button } from './Button';
import { kitColors } from './colors';
import { elevation } from './elevation';

interface SheetAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Sheet — Found UI dialog: white panel on a dim overlay, title + quiet
 * subtitle + close, scrolling body, footer with actions on the right
 * (Cancel, then the one primary). Pass `primary` for the standard footer,
 * or `footer` for anything custom.
 */
export function Sheet({
  visible, onClose, title, subtitle, wide, children, primary, secondary, danger, footer, footerNote,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
  /** The sheet's main action (near-black). Adds a Cancel button automatically. */
  primary?: SheetAction;
  /** Replaces the default Cancel. */
  secondary?: SheetAction;
  /** Destructive action, shown on the left. */
  danger?: SheetAction;
  /** Custom footer (replaces the standard actions). */
  footer?: ReactNode;
  /** Quiet text on the left of the footer (e.g. "Saved to Foundry"). */
  footerNote?: string;
}) {
  const showFooter = !!(footer || primary || danger);
  const cancel = secondary ?? { label: 'Cancel', onPress: onClose };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-bg-overlay items-center justify-start pt-[44px] pb-[24px]"
      >
        <View
          className={`bg-bg-page border border-border rounded-lg overflow-hidden flex-shrink ${wide ? 'w-[880px]' : 'w-[640px]'}`}
          style={[elevation.overlay, { maxHeight: 784 }]}
        >
          <View className="flex-row items-start justify-between gap-[16px] pl-[24px] pr-[12px] pt-[20px] pb-[16px] border-b border-border">
            <View className="flex-1 pt-[2px]">
              <Text className="text-heading-lg text-text-primary">{title}</Text>
              {subtitle ? <Text className="text-body-sm text-text-tertiary mt-[4px]">{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              className="w-[44px] h-[44px] rounded-md items-center justify-center"
            >
              {({ pressed }) => (
                <View className={`w-[36px] h-[36px] rounded-md items-center justify-center ${pressed ? 'bg-bg-subtle' : ''}`}>
                  <X size={20} color={kitColors.icon} />
                </View>
              )}
            </Pressable>
          </View>

          <ScrollView
            className="flex-shrink"
            contentContainerStyle={{ padding: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {showFooter ? (
            <View className="flex-row items-center gap-[8px] px-[24px] py-[16px] border-t border-border">
              {footer ?? (
                <>
                  {danger ? <Button variant="danger" {...danger} /> : null}
                  <View className="flex-1">
                    {footerNote ? <Text className="text-body-sm text-text-tertiary" numberOfLines={1}>{footerNote}</Text> : null}
                  </View>
                  <Button variant="ghost" {...cancel} />
                  {primary ? <Button variant="primary" {...primary} /> : null}
                </>
              )}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

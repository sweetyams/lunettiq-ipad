import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { Modal } from '@/src/ui/Modal';
import { Button } from './Button';
import { kitColors } from './colors';
import { elevation } from './elevation';
import { useLayout, useKeyboard } from '../layout';

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
 *
 * Sizes itself from the screen, not 13"-landscape constants: width fits portrait 11",
 * height is the room above the keyboard, and the header compacts while typing so a
 * search field and its results stay visible. Search sheets pass `fill` (take all the
 * room) and `scroll={false}` (they host their own FlatList).
 */
export function Sheet({
  visible, onClose, title, subtitle, wide, children, primary, secondary, danger, footer, footerNote, fill, scroll = true,
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
  /** Take all the available height (search/picker sheets). */
  fill?: boolean;
  /** Wrap children in a ScrollView (default). Pass false when the body manages its own list. */
  scroll?: boolean;
}) {
  const showFooter = !!(footer || primary || danger);
  const cancel = secondary ?? { label: 'Cancel', onPress: onClose };
  const layout = useLayout();
  const keyboard = useKeyboard();
  const insets = useSafeAreaInsets();

  const typing = keyboard.visible;
  const top = Math.max(insets.top, 8) + (typing ? 8 : layout.isPortrait ? 72 : 36);
  const bottom = (typing ? keyboard.height : insets.bottom) + 16;
  const width = Math.min(wide ? 880 : 640, layout.width - 32);
  const maxHeight = Math.max(240, Math.min(fill ? 2000 : 840, layout.height - top - bottom));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-bg-overlay items-center" style={{ paddingTop: top, paddingBottom: bottom }}>
        <View
          className="bg-bg-page border border-border rounded-lg overflow-hidden flex-shrink"
          style={[elevation.overlay, { width, maxHeight }, fill ? { height: maxHeight } : null]}
        >
          <View className={`flex-row items-start justify-between gap-[16px] pl-[24px] pr-[12px] border-b border-border ${typing ? 'pt-[8px] pb-[8px]' : 'pt-[20px] pb-[16px]'}`}>
            <View className="flex-1 pt-[2px]">
              <Text className="text-heading-lg text-text-primary">{title}</Text>
              {subtitle && !typing ? <Text className="text-body-sm text-text-tertiary mt-[4px]">{subtitle}</Text> : null}
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

          {scroll ? (
            <ScrollView
              className={fill ? 'flex-1' : 'flex-shrink'}
              contentContainerStyle={{ padding: 24 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View className={fill ? 'flex-1' : 'flex-shrink'}>{children}</View>
          )}

          {showFooter ? (
            <View className={`flex-row items-center gap-[8px] px-[24px] border-t border-border ${typing ? 'py-[8px]' : 'py-[16px]'}`}>
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
      </View>
    </Modal>
  );
}

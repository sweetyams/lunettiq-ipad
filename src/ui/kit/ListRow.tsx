import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react-native';
import { kitColors } from './colors';

/**
 * ListRow — the Builder's list row: leading (avatar/icon), title + quiet
 * subtitle, trailing (badge/value/button), hairline divider, subtle pressed
 * state. Selection is a subtle fill + medium title, never a coloured edge.
 */
export function ListRow({
  title, subtitle, leading, trailing, onPress, chevron, selected, divider = true, accessibilityLabel,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  selected?: boolean;
  divider?: boolean;
  accessibilityLabel?: string;
}) {
  const content = (pressed: boolean) => (
    <View className={`flex-row items-center gap-[14px] px-[20px] min-h-[64px] py-[10px] ${selected || pressed ? 'bg-bg-subtle' : ''} ${divider ? 'border-t border-border' : ''}`}>
      {leading}
      <View className="flex-1">
        {typeof title === 'string' ? (
          <Text className="text-body-md font-medium text-text-primary" numberOfLines={1}>{title}</Text>
        ) : title}
        {subtitle ? (
          typeof subtitle === 'string'
            ? <Text className="text-body-sm text-text-tertiary mt-[2px]" numberOfLines={1}>{subtitle}</Text>
            : subtitle
        ) : null}
      </View>
      {trailing}
      {chevron ? <ChevronRight size={18} color={kitColors.iconMuted} /> : null}
    </View>
  );

  if (!onPress) return content(false);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected: !!selected }}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

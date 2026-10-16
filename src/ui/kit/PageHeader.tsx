import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

/**
 * PageHeader — title, quiet subtitle, actions on the right (Found UI PageHeader).
 * White, with a hairline under it; no coloured bands.
 */
export function PageHeader({ title, subtitle, actions, meta }: {
  title: string;
  subtitle?: string;
  /** Buttons, right-aligned. */
  actions?: ReactNode;
  /** Small objects next to the title (badges). */
  meta?: ReactNode;
}) {
  return (
    <View className="flex-row items-end justify-between gap-[16px] px-[32px] pt-[28px] pb-[20px] border-b border-border bg-bg-page">
      <View className="flex-1">
        <View className="flex-row items-center gap-[12px]">
          <Text className="text-display-lg text-text-primary" numberOfLines={1}>{title}</Text>
          {meta}
        </View>
        {subtitle ? <Text className="text-body-md text-text-tertiary mt-[4px]" numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {actions ? <View className="flex-row items-center gap-[8px]">{actions}</View> : null}
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import type { ReactNode } from 'react';
import { elevation } from './elevation';

/**
 * Section — a white panel with a hairline and soft "raised" elevation
 * (Found UI PageSection). Never a grey fill.
 */
export function Section({ children, title, count, action, padded = true }: {
  children: ReactNode;
  title?: string;
  count?: number;
  action?: { label: string; onPress: () => void };
  /** false for edge-to-edge lists (rows bring their own padding). */
  padded?: boolean;
}) {
  return (
    <View className="bg-bg-surface border border-border rounded-lg overflow-hidden" style={elevation.raised}>
      {title ? <SectionHeader title={title} count={count} action={action} /> : null}
      <View className={padded ? 'px-[20px] pb-[20px]' : ''} style={!title && padded ? { paddingTop: 20 } : undefined}>
        {children}
      </View>
    </View>
  );
}

/** Uppercase tracked label + optional count and text action (Found UI SectionHeader). */
export function SectionHeader({ title, count, action }: {
  title: string;
  count?: number;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View className="flex-row items-center justify-between px-[20px] pt-[16px] pb-[10px] min-h-[52px]">
      <View className="flex-row items-center gap-[8px]">
        <Text className="text-caption-sm uppercase text-text-tertiary">{title}</Text>
        {typeof count === 'number' ? (
          <Text className="text-caption-sm text-text-dim">{count}</Text>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="button" className="min-h-[44px] justify-center">
          <Text className="text-body-sm font-medium text-text-primary">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

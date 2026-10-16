import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

/**
 * Badge — Found UI status object: tinted background, 1px ring, coloured text.
 * Status is always a small object like this (or a StatusDot), never a coloured
 * edge or a filled slab. Mirrors foundry/src/lib/ui/Badge.tsx.
 */
export type BadgeTone = 'neutral' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'solid';

const TONES: Record<BadgeTone, { box: string; text: string }> = {
  neutral: { box: 'bg-bg-subtle border-border', text: 'text-text-secondary' },
  outline: { box: 'bg-bg-page border-border', text: 'text-text-primary' },
  success: { box: 'bg-success-soft border-success-ring', text: 'text-success' },
  warning: { box: 'bg-warning-soft border-warning-ring', text: 'text-warning' },
  danger: { box: 'bg-error-soft border-error-ring', text: 'text-error' },
  info: { box: 'bg-info-soft border-info-ring', text: 'text-info' },
  solid: { box: 'bg-accent border-accent', text: 'text-accent-text' },
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Fully rounded (counts, filters) instead of the default 6px. */
  pill?: boolean;
  /** Leading status dot in the badge's colour. */
  dot?: boolean;
  accessibilityLabel?: string;
}

const DOT_FOR_TONE: Record<BadgeTone, StatusDotTone> = {
  neutral: 'muted', outline: 'muted', success: 'success', warning: 'warning', danger: 'danger', info: 'info', solid: 'muted',
};

export function Badge({ children, tone = 'neutral', pill, dot, accessibilityLabel }: BadgeProps) {
  const t = TONES[tone];
  // Alignment is the parent's job (rows centre it; columns wrap it in items-start).
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={`flex-row items-center gap-[6px] border px-[8px] py-[2px] ${pill ? 'rounded-full' : 'rounded-sm'} ${t.box}`}
    >
      {dot ? <StatusDot tone={DOT_FOR_TONE[tone]} /> : null}
      <Text className={`text-body-sm font-medium ${t.text}`} numberOfLines={1}>{children}</Text>
    </View>
  );
}

export type StatusDotTone = 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'primary';

const DOT: Record<StatusDotTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-error',
  info: 'bg-info',
  muted: 'bg-border-strong',
  primary: 'bg-accent',
};

/** 8px status dot (Found UI StatusDot). */
export function StatusDot({ tone = 'success', size = 8 }: { tone?: StatusDotTone; size?: 6 | 8 | 10 }) {
  return <View className={`rounded-full ${DOT[tone]}`} style={{ width: size, height: size }} />;
}

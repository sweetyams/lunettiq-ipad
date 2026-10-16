import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import type { ComponentType } from 'react';
import { kitColors } from './colors';

/**
 * Button — Found UI variants. One `primary` (near-black) per view; everything
 * else is `secondary` (white + hairline) or `ghost`. Lunettiq blue is not a
 * button colour. Sizes are touch sizes (Builder heights + 50%).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const VARIANTS: Record<ButtonVariant, { box: string; pressed: string; text: string; icon: string }> = {
  primary: { box: 'bg-accent border border-accent', pressed: 'bg-accent-hover', text: 'text-accent-text', icon: kitColors.inverse },
  secondary: { box: 'bg-bg-page border border-border', pressed: 'bg-bg-subtle', text: 'text-text-primary', icon: kitColors.text },
  ghost: { box: 'border border-transparent', pressed: 'bg-bg-subtle', text: 'text-text-primary', icon: kitColors.text },
  danger: { box: 'bg-bg-page border border-error-ring', pressed: 'bg-error-soft', text: 'text-error', icon: kitColors.danger },
};

const SIZES: Record<ButtonSize, { box: string; text: string; icon: number }> = {
  sm: { box: 'min-h-[36px] px-[12px] gap-[6px]', text: 'text-body-sm', icon: 16 },
  md: { box: 'min-h-[44px] px-[16px] gap-[8px]', text: 'text-body-md', icon: 18 },
  lg: { box: 'min-h-[52px] px-[20px] gap-[8px]', text: 'text-body-lg', icon: 20 },
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconComponent;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the container width (forms, sheets). Default hugs content. */
  block?: boolean;
  accessibilityLabel?: string;
}

export function Button({
  label, onPress, variant = 'secondary', size = 'md', icon: Icon, disabled, loading, block, accessibilityLabel,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!(disabled || loading) }}
      className={`${block ? 'self-stretch' : 'self-start'} ${disabled ? 'opacity-40' : ''}`}
    >
      {({ pressed }) => (
        <View className={`flex-row items-center justify-center rounded-md ${s.box} ${v.box} ${pressed ? v.pressed : ''}`}>
          {loading ? <ActivityIndicator size="small" color={v.icon} /> : Icon ? <Icon size={s.icon} color={v.icon} strokeWidth={1.75} /> : null}
          <Text className={`${s.text} font-medium ${v.text}`} numberOfLines={1}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

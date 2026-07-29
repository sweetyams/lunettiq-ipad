import { Pressable, Text } from 'react-native';

type ChipVariant = 'default' | 'on' | 'neg' | 'add';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  disabled?: boolean;
}

export function Chip({ label, variant = 'default', onPress, disabled = false }: ChipProps) {
  const containerClasses: Record<ChipVariant, string> = {
    default: 'bg-bg-surface border border-border',
    on:      'bg-bg-inverse border border-bg-inverse',
    neg:     'bg-bg-surface border border-error',
    add:     'bg-bg-surface border border-border border-dashed',
  };

  const textClasses: Record<ChipVariant, string> = {
    default: 'text-text-secondary',
    on:      'text-text-inverse',
    neg:     'text-error line-through',
    add:     'text-text-muted',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="button"
      className={`flex-row items-center gap-[6px] min-h-[36px] px-[12px] rounded-sm ${containerClasses[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-body-sm ${textClasses[variant]}`}>
        {variant === 'add' ? `+ ${label}` : label}
      </Text>
    </Pressable>
  );
}
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type ButtonVariant = 'primary' | 'dark' | 'quiet' | 'ghost' | 'danger';
type ButtonSize = 'default' | 'sm';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  accessibilityLabel?: string;
}

export function Button({
  variant = 'ghost',
  size = 'default',
  block = false,
  onPress,
  disabled = false,
  loading = false,
  children,
  className = '',
  accessibilityLabel,
}: ButtonProps) {
  const containerVariants: Record<ButtonVariant, string> = {
    primary: 'bg-brand border border-brand',
    dark:    'bg-accent border border-accent',
    quiet:   'bg-bg-muted border border-transparent',
    ghost:   'bg-transparent border border-border',
    danger:  'bg-transparent border border-error',
  };

  const textVariants: Record<ButtonVariant, string> = {
    primary: 'text-brand-text',
    dark:    'text-accent-text',
    quiet:   'text-text-secondary',
    ghost:   'text-text-primary',
    danger:  'text-error',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    default: 'min-h-[44px] px-md',
    sm:      'min-h-[34px] px-[12px]',
  };

  const textSizeClasses: Record<ButtonSize, string> = {
    default: 'text-body-sm',
    sm:      'text-body-xs',
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`flex-row items-center justify-center gap-sm rounded-sm ${sizeClasses[size]} ${containerVariants[variant]} ${block ? 'w-full' : ''} ${isDisabled ? 'opacity-40' : ''} ${className}`}
      style={({ pressed }) => ({ opacity: pressed && !isDisabled ? 0.8 : isDisabled ? 0.4 : 1 })}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'dark' ? '#FFFFFF' : '#1D1F21'}
        />
      ) : typeof children === 'string' ? (
        <Text className={`${textVariants[variant]} ${textSizeClasses[size]} font-medium text-center`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
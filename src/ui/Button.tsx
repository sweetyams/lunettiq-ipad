import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

export function Button({ 
  variant, 
  onPress, 
  disabled = false, 
  children, 
  loading = false, 
  className = '',
  accessibilityLabel,
}: ButtonProps) {
  const baseClasses = 'p-md rounded-md min-h-[44px] min-w-[44px] flex-row items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-accent',           // Single primary action — accent color
    secondary: 'bg-brand',          // Navigation actions — brand color
    ghost: 'bg-transparent border border-border',
    danger: 'bg-transparent',       // Destructive — text-only, red text
  };

  const textClasses = {
    primary: 'text-accent-text',
    secondary: 'text-brand-text',
    ghost: 'text-text-primary',
    danger: 'text-error',
  };

  const disabledClasses = disabled || loading ? 'opacity-40' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'ghost' || variant === 'danger' ? '#1D1F21' : '#FFFFFF'} 
        />
      ) : (
        <Text className={`${textClasses[variant]} text-body font-medium text-center`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

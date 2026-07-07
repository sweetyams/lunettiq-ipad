import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({ variant, onPress, disabled = false, children, loading = false }: ButtonProps) {
  const baseClasses = 'p-md rounded-md min-h-[44px] min-w-[44px] flex-row items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-navy',
    secondary: 'bg-warmGrey',
    ghost: 'bg-transparent',
    danger: 'bg-error',
  };

  const textClasses = {
    primary: 'text-white',
    secondary: 'text-charcoal',
    ghost: 'text-navy',
    danger: 'text-white',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'ghost' ? '#0A153D' : '#FFFFFF'} 
        />
      ) : (
        <Text className={`${textClasses[variant]} text-body font-medium text-center`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
import { View, Text } from 'react-native';

type TagVariant = 'default' | 'cult' | 'vault' | 'ok' | 'warn' | 'err';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

export function Tag({ label, variant = 'default' }: TagProps) {
  const containerClasses: Record<TagVariant, string> = {
    default: 'bg-bg-muted',
    cult:    'bg-brand',
    vault:   'bg-warning',
    ok:      'bg-success-soft',
    warn:    'bg-warning-soft',
    err:     'bg-error-soft',
  };

  const textClasses: Record<TagVariant, string> = {
    default: 'text-text-secondary',
    cult:    'text-brand-text',
    vault:   'text-text-primary',
    ok:      'text-success',
    warn:    'text-warning',
    err:     'text-error',
  };

  return (
    <View className={`items-center justify-center h-[22px] px-sm rounded-sm ${containerClasses[variant]}`}>
      <Text className={`text-caption-md tracking-wide uppercase ${textClasses[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
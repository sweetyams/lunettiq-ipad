import { View, Text } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: AvatarSize;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.trim()?.[0] ?? '';
  const l = lastName?.trim()?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export function Avatar({ firstName, lastName, size = 'md' }: AvatarProps) {
  const sizeClasses: Record<AvatarSize, string> = {
    sm: 'w-[32px] h-[32px]',
    md: 'w-[44px] h-[44px]',
    lg: 'w-[88px] h-[88px]',
  };

  // Found UI: white disc with a hairline, quiet initials. No black or grey slabs.
  const textClasses: Record<AvatarSize, string> = {
    sm: 'text-[13px] font-medium text-text-secondary',
    md: 'text-[15px] font-medium text-text-secondary',
    lg: 'text-[28px] font-medium text-text-secondary',
  };

  return (
    <View className={`rounded-full items-center justify-center bg-bg-page border border-border ${sizeClasses[size]}`}>
      <Text className={textClasses[size]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}
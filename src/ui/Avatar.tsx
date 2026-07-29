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

  const bgClasses: Record<AvatarSize, string> = {
    sm: 'bg-bg-muted',
    md: 'bg-bg-muted',
    lg: 'bg-bg-inverse',
  };

  const textClasses: Record<AvatarSize, string> = {
    sm: 'text-[12px] font-medium text-text-muted',
    md: 'text-[14px] font-medium text-text-muted',
    lg: 'text-[26px] text-text-inverse',
  };

  return (
    <View className={`rounded-full items-center justify-center ${sizeClasses[size]} ${bgClasses[size]}`}>
      <Text className={textClasses[size]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}
import { View, Text, Pressable } from 'react-native';
import { User } from 'lucide-react-native';
import type { Client } from '@/src/api/clients.types';

interface ClientRowProps {
  client: Client;
  isSelected?: boolean;
  onPress: () => void;
}

export function ClientRow({ client, isSelected = false, onPress }: ClientRowProps) {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  // Format last activity (updatedAt)
  const lastActivity = new Date(client.updatedAt);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  let activityText = '';
  if (diffInDays === 0) {
    activityText = 'Today';
  } else if (diffInDays === 1) {
    activityText = 'Yesterday';
  } else if (diffInDays < 7) {
    activityText = `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    activityText = `${Math.floor(diffInDays / 7)} weeks ago`;
  } else {
    activityText = lastActivity.toLocaleDateString();
  }

  return (
    <Pressable
      onPress={onPress}
      className={`
        p-md border-b border-border
        ${isSelected ? 'bg-bg-surface' : 'bg-bg-page active:bg-bg-surface'}
      `}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-brand items-center justify-center mr-md">
          <Text className="text-brand-text text-bodyStrong">{initials}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-bodyStrong text-text-primary">{name}</Text>
          <Text className="text-caption text-text-muted">
            {client.email || 'No email'}
          </Text>
        </View>

        {/* Last activity */}
        <Text className="text-caption text-text-muted">{activityText}</Text>
      </View>
    </Pressable>
  );
}
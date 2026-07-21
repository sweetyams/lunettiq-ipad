import { View, Text, Pressable } from 'react-native';
import type { Client } from '@/src/api/clients.types';

interface ClientCardProps {
  client: Client;
  onPress: (id: string) => void;
  isSelected?: boolean;
}

export function ClientCard({ client, onPress, isSelected = false }: ClientCardProps) {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  // Extract tier from tags (e.g. "member-cult" → "CULT")
  const tierTag = client.tags.find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  return (
    <Pressable
      onPress={() => onPress(client.id)}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${name}`}
      className={`flex-row items-center p-md border-b border-border min-h-[44px] ${
        isSelected ? 'bg-bg-surface' : 'bg-bg-page'
      }`}
    >
      {/* Avatar */}
      <View className="w-[44px] h-[44px] rounded-full bg-brand items-center justify-center mr-md">
        <Text className="text-brand-text text-caption font-medium">{initials}</Text>
      </View>

      {/* Name + meta */}
      <View className="flex-1 min-w-0">
        <Text className="text-text-primary text-bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-text-muted text-caption" numberOfLines={1}>
          {client.email || 'No email'}
          {client.orderCount ? ` · ${client.orderCount} orders` : ''}
        </Text>
      </View>

      {/* Tier badge */}
      {tier && (
        <View className="bg-brand rounded-full px-md py-xs">
          <Text className="text-brand-text text-captionStrong">{tier}</Text>
        </View>
      )}
    </Pressable>
  );
}

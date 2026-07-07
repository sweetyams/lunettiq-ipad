import { View, Text, Pressable } from 'react-native';
import type { Client } from '@/src/api/clients.types';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface ClientCardProps {
  client: Client;
  onPress: (shopifyId: string) => void;
  isSelected?: boolean;
}

export function ClientCard({ client, onPress, isSelected = false }: ClientCardProps) {
  const mode = usePrivacyStore((s) => s.mode);
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  // Extract tier from tags (e.g. "member-cult" → "CULT")
  const tierTag = client.tags.find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  return (
    <Pressable
      onPress={() => onPress(client.shopifyId)}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${name}`}
      className={`flex-row items-center p-md border-b border-warmGrey min-h-[44px] ${
        isSelected ? 'bg-warmGrey/50' : 'bg-white'
      }`}
    >
      {/* Avatar */}
      <View className="w-[44px] h-[44px] rounded-full bg-navy items-center justify-center mr-md">
        <Text className="text-white text-caption font-bold">{initials}</Text>
      </View>

      {/* Name + meta */}
      <View className="flex-1 min-w-0">
        <Text className="text-charcoal text-body font-medium" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-midGrey text-caption" numberOfLines={1}>
          {client.email ?? 'No email'}
          {client.orderCount ? ` · ${client.orderCount} orders` : ''}
        </Text>
      </View>

      {/* Tier badge — hidden in client-visible mode */}
      {tier && mode === 'staff' && (
        <View className="bg-navy rounded-full px-sm py-[2px]">
          <Text className="text-white text-captionStrong">{tier}</Text>
        </View>
      )}
    </Pressable>
  );
}

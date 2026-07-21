import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Users, AlertCircle } from 'lucide-react-native';
import { useRecentClients } from '@/src/api/useClients';
import type { Client } from '@/src/api/clients.types';

interface RecentClientsCardProps {
  onClientPress?: (clientId: string) => void;
}

export function RecentClientsCard({ onClientPress }: RecentClientsCardProps) {
  const { data, isLoading, error, refetch } = useRecentClients();
  const clients = data?.clients ?? [];

  const relativeTime = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Recent Clients
        </Text>
        <View className="items-center py-md">
          <ActivityIndicator color="#737373" size="small" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Recent Clients
        </Text>
        <View className="items-center py-md">
          <AlertCircle color="#DC2626" size={20} />
          <Text className="text-caption text-text-muted mt-sm">Failed to load clients</Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-sm min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Retry loading recent clients"
          >
            <Text className="text-caption text-text-primary font-medium">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (clients.length === 0) {
    return (
      <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
        <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
          Recent Clients
        </Text>
        <View className="items-center py-md">
          <Users color="#A3A3A3" size={20} />
          <Text className="text-caption text-text-muted mt-sm">No recent clients</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg">
      <Text className="text-captionStrong text-text-muted uppercase tracking-wider mb-md">
        Recent Clients
      </Text>

      {clients.map((client) => {
        const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
        const initials = [client.firstName?.[0], client.lastName?.[0]]
          .filter(Boolean)
          .join('')
          .toUpperCase() || '?';

        return (
          <Pressable
            key={client.id}
            onPress={() => onClientPress?.(client.id)}
            className="flex-row items-center py-sm border-b border-border last:border-b-0 min-h-[44px]"
            accessibilityRole="button"
            accessibilityLabel={`View ${name} profile`}
          >
            <View className="w-8 h-8 rounded-full bg-brand items-center justify-center">
              <Text className="text-brand-text text-caption font-medium">
                {initials}
              </Text>
            </View>
            <View className="flex-1 ml-sm">
              <Text className="text-body text-text-primary" numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Text className="text-caption text-text-muted ml-sm">
              {relativeTime(client.updatedAt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

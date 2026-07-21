import { View, Text, Pressable } from 'react-native';
import { Mail, Phone, MapPin, CreditCard } from 'lucide-react-native';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import type { ClientProfile } from '@/src/api/clients.types';

interface ProfileHeaderProps {
  client: ClientProfile;
  onStartSession: () => void;
}

export function ProfileHeader({ client, onStartSession }: ProfileHeaderProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const tierTag = client.tags.find((tag) =>
    ['CULT', 'VAULT'].includes(tag.toUpperCase())
  );
  const tier = tierTag?.toUpperCase() || 'ESSENTIAL';

  const formatCurrency = (amount: number | null): string => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <View className="bg-bg-elevated border-b border-border px-2xl py-lg">
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="w-16 h-16 rounded-full bg-brand items-center justify-center mr-lg">
          <Text className="text-text-inverse text-headline font-bold">{initials}</Text>
        </View>

        {/* Name and tier */}
        <View className="flex-1">
          <Text className="text-displayMd text-text-primary font-bold">{name}</Text>
          <View className="flex-row items-center mt-sm gap-md">
            <TierBadge tier={tier} />
            {client.status !== 'active' && (
              <View className="bg-warning/20 px-md py-xs rounded-md">
                <Text className="text-captionStrong text-warning">{client.status}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact info */}
        <View className="items-end mr-lg">
          {client.email && (
            <View className="flex-row items-center mb-xs">
              <Mail color="#6B6B6B" size={16} />
              <Text className="text-body text-text-muted ml-sm">{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View className="flex-row items-center mb-xs">
              <Phone color="#6B6B6B" size={16} />
              <Text className="text-body text-text-muted ml-sm">{client.phone}</Text>
            </View>
          )}
          {client.enrichment?.homeLocationId && (
            <View className="flex-row items-center">
              <MapPin color="#6B6B6B" size={16} />
              <Text className="text-body text-text-muted ml-sm">
                {client.enrichment.homeLocationId}
              </Text>
            </View>
          )}
        </View>

        {/* LTV / Credits */}
        {privacyMode === 'staff' ? (
          <View className="items-center">
            <Text className="text-captionStrong text-text-muted">LTV</Text>
            <Text className="text-headline text-text-primary">
              {formatCurrency(client.totalSpent)}
            </Text>
            <Text className="text-caption text-text-muted">
              {client.orderCount ?? 0} orders
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <CreditCard color="#005D23" size={24} />
            <Text className="text-bodyStrong text-accent mt-xs">Credits available</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    CULT: 'bg-brand text-text-inverse',
    VAULT: 'bg-accent text-text-inverse',
    ESSENTIAL: 'bg-border text-text-primary',
  };

  return (
    <View className={`px-md py-xs rounded-full ${colors[tier] || colors.ESSENTIAL}`}>
      <Text className="text-captionStrong font-bold">{tier}</Text>
    </View>
  );
}

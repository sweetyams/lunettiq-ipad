import { View, Text, ScrollView } from 'react-native';
import { useClient } from '@/src/api/useClients';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { StartSessionButton } from '@/src/features/session/StartSessionButton';
import { ClientTimeline } from '@/src/features/session/ClientTimeline';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';

interface ClientDetailPanelProps {
  id: string;
}

export default function ClientDetailPanel({ id }: ClientDetailPanelProps) {
  const { data: client, isLoading, error } = useClient(id);
  const mode = usePrivacyStore((s) => s.mode);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error="Failed to load client" onRetry={() => {}} />;
  if (!client) return <EmptyState message="Client not found" />;

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const tierTag = client.tags.find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-xl">
      {/* Header */}
      <View className="flex-row items-center mb-lg">
        <View className="w-[56px] h-[56px] rounded-full bg-navy items-center justify-center mr-md">
          <Text className="text-white text-headline font-bold">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-charcoal text-displayMd font-bold">{name}</Text>
          <Text className="text-midGrey text-body">
            {client.email ?? 'No email'}
          </Text>
        </View>
        {tier && mode === 'staff' && (
          <View className="bg-navy rounded-full px-md py-xs">
            <Text className="text-white text-captionStrong">{tier}</Text>
          </View>
        )}
      </View>

      {/* Start Session Button */}
      <View className="mb-lg">
        <StartSessionButton clientId={client.shopifyId} clientName={name} />
      </View>

      {/* Contact info */}
      <View className="bg-white rounded-lg border border-warmGrey p-md mb-md">
        <Text className="text-midGrey text-captionStrong uppercase tracking-wider mb-sm">
          Contact
        </Text>
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Phone" value={client.phone} />
      </View>

      {/* Staff-only: Order stats */}
      {mode === 'staff' && (
        <View className="bg-white rounded-lg border border-warmGrey p-md mb-md">
          <Text className="text-midGrey text-captionStrong uppercase tracking-wider mb-sm">
            Orders
          </Text>
          <InfoRow label="Total orders" value={client.orderCount ? String(client.orderCount) : '0'} />
          <InfoRow label="Total spent" value={client.totalSpent ? `$${client.totalSpent}` : '—'} />
        </View>
      )}

      {/* Enrichment — fit profile */}
      {client.enrichment && (
        <View className="bg-white rounded-lg border border-warmGrey p-md mb-md">
          <Text className="text-midGrey text-captionStrong uppercase tracking-wider mb-sm">
            Fit Profile
          </Text>
          <InfoRow label="Face shape" value={client.enrichment.faceShape} />
          <InfoRow
            label="Frame width"
            value={client.enrichment.frameWidthMm ? `${client.enrichment.frameWidthMm}mm` : null}
          />
          <InfoRow
            label="Bridge width"
            value={client.enrichment.bridgeWidthMm ? `${client.enrichment.bridgeWidthMm}mm` : null}
          />
        </View>
      )}

      {/* Staff-only: Internal notes */}
      {mode === 'staff' && client.enrichment?.internalNotes && (
        <View className="bg-white rounded-lg border border-warmGrey p-md mb-md">
          <Text className="text-midGrey text-captionStrong uppercase tracking-wider mb-sm">
            Internal Notes
          </Text>
          <Text className="text-charcoal text-body">{client.enrichment.internalNotes}</Text>
        </View>
      )}

      {/* Staff-only: Tags */}
      {mode === 'staff' && client.tags.length > 0 && (
        <View className="bg-white rounded-lg border border-warmGrey p-md mb-md">
          <Text className="text-midGrey text-captionStrong uppercase tracking-wider mb-sm">
            Tags
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {client.tags.map((tag) => (
              <View key={tag} className="bg-offWhite border border-warmGrey rounded-full px-sm py-xs">
                <Text className="text-charcoal text-caption">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Client Timeline */}
      <ClientTimeline shopifyCustomerId={client.shopifyId} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="flex-row justify-between py-sm border-b border-warmGrey last:border-b-0">
      <Text className="text-midGrey text-body">{label}</Text>
      <Text className="text-charcoal text-body font-medium">{value ?? '—'}</Text>
    </View>
  );
}

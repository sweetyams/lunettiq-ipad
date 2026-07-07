import { View, Text, ScrollView, TextInput } from 'react-native';
import { useState } from 'react';
import { useClient } from '@/src/api/useClients';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';

interface ClientContextPanelProps {
  clientId: string;
}

export function ClientContextPanel({ clientId }: ClientContextPanelProps) {
  const { data: client, isLoading, error, refetch } = useClient(clientId);
  const mode = usePrivacyStore((s) => s.mode);
  const [sessionNotes, setSessionNotes] = useState('');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!client) return <ErrorState error={new Error('Client not found')} onRetry={() => refetch()} />;

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  
  // Extract tier from tags (e.g. "member-cult" → "CULT")
  const tierTag = client.tags.find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  return (
    <ScrollView className="flex-1 bg-white p-lg">
      {/* Identity header */}
      <View className="flex-row items-center mb-lg">
        {/* Avatar */}
        <View className="w-16 h-16 rounded-full bg-navy items-center justify-center mr-md">
          <Text className="text-white text-headline font-bold">{initials}</Text>
        </View>
        
        {/* Name and tier */}
        <View className="flex-1">
          <Text className="text-charcoal text-headline font-semibold" numberOfLines={1}>
            {name}
          </Text>
          
          {/* Tier badge — hidden in client-visible mode */}
          {tier && mode === 'staff' && (
            <View className="bg-navy rounded-full px-sm py-[2px] self-start mt-xs">
              <Text className="text-white text-captionStrong">{tier}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Fit profile section */}
      <View className="mb-lg">
        <Text className="text-charcoal text-bodyStrong mb-sm">Fit Profile</Text>
        <View className="bg-offWhite rounded-lg p-md border border-warmGrey">
          {client.enrichment ? (
            <View>
              {client.enrichment.faceShape && (
                <View className="mb-sm">
                  <Text className="text-midGrey text-caption">Face shape</Text>
                  <Text className="text-charcoal text-body">{client.enrichment.faceShape}</Text>
                </View>
              )}
              
              {client.enrichment.frameWidthMm && (
                <View className="mb-sm">
                  <Text className="text-midGrey text-caption">Frame width</Text>
                  <Text className="text-charcoal text-body">{client.enrichment.frameWidthMm}mm</Text>
                </View>
              )}
              
              {client.enrichment.bridgeWidthMm && (
                <View>
                  <Text className="text-midGrey text-caption">Bridge width</Text>
                  <Text className="text-charcoal text-body">{client.enrichment.bridgeWidthMm}mm</Text>
                </View>
              )}
              
              {!client.enrichment.faceShape && !client.enrichment.frameWidthMm && !client.enrichment.bridgeWidthMm && (
                <Text className="text-midGrey text-body">No measurements yet</Text>
              )}
            </View>
          ) : (
            <Text className="text-midGrey text-body">No measurements yet</Text>
          )}
        </View>
      </View>

      {/* Preferences placeholder */}
      <View className="mb-lg">
        <Text className="text-charcoal text-bodyStrong mb-sm">Preferences</Text>
        <View className="bg-offWhite rounded-lg p-md border border-warmGrey">
          <Text className="text-midGrey text-body">Preferences coming soon</Text>
        </View>
      </View>

      {/* Session notes */}
      <View>
        <Text className="text-charcoal text-bodyStrong mb-sm">Session Notes</Text>
        <TextInput
          value={sessionNotes}
          onChangeText={setSessionNotes}
          placeholder="Session notes…"
          placeholderTextColor="#6B6B6B"
          multiline
          textAlignVertical="top"
          className="bg-white border border-warmGrey rounded-lg p-md text-charcoal text-body min-h-[100px]"
          accessibilityLabel="Session notes"
          accessibilityHint="Add notes about this session"
        />
      </View>
    </ScrollView>
  );
}
import { View, Text, Pressable } from 'react-native';
import { Card, RowKV, Chip, Tag, Avatar, Button } from '@/src/ui';
import { useClientLinks, useClientSegments } from '@/src/api/useClients';
import type { ClientLink, ClientSegment, RelationshipType } from '@/src/api/clients.types';

interface RelationshipsTabProps {
  clientId: string;
}

// Utility function to capitalize relationship type for display
function capitalizeRelationship(type: RelationshipType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Format client name from linked client data
function formatClientName(linkedClient: ClientLink['linkedClient']): string {
  const firstName = linkedClient.firstName || '';
  const lastName = linkedClient.lastName || '';
  return `${firstName} ${lastName}`.trim() || linkedClient.email || 'Unknown';
}

export function RelationshipsTab({ clientId }: RelationshipsTabProps) {
  const { data: links, isLoading: isLoadingLinks } = useClientLinks(clientId);
  const { data: segments, isLoading: isLoadingSegments } = useClientSegments(clientId);

  // Placeholder for referral data - would need proper API endpoint
  const referralData = {
    referredBy: null, // Would come from client data or separate endpoint
    hasReferred: { count: 0, names: [] }, // Would be computed from links/referrals
    creditsEarned: 0, // Would come from loyalty credits with type 'referral'
  };

  return (
    <View className="flex-row gap-lg p-lg">
      {/* Left Column - Linked Clients */}
      <View className="flex-1">
        <Card>
          <Card.Head>
            <Text className="text-heading-sm text-color-text-primary">Linked clients</Text>
            <Pressable>
              <Text className="text-color-brand text-body-sm">+ Link a client</Text>
            </Pressable>
          </Card.Head>
          <Card.Body noPadding>
            {isLoadingLinks ? (
              <View className="p-md">
                <Text className="text-color-text-muted text-body-sm">Loading...</Text>
              </View>
            ) : !links || links.length === 0 ? (
              <View className="p-md">
                <Text className="text-color-text-muted text-body-sm">
                  No linked clients. Link family members or colleagues to keep relationships organized.
                </Text>
              </View>
            ) : (
              links.map((link, index) => (
                <View
                  key={link.id}
                  className={`flex-row items-center gap-[12px] p-md ${
                    index < links.length - 1 ? 'border-b border-color-border' : ''
                  }`}
                >
                  <Avatar 
                    size="md" 
                    firstName={link.linkedClient.firstName}
                    lastName={link.linkedClient.lastName}
                  />
                  <View className="flex-1">
                    <Text className="text-body-md font-medium text-color-text-primary">
                      {formatClientName(link.linkedClient)}
                    </Text>
                    <Text className="text-body-sm text-color-text-muted">
                      Connected on {new Date(link.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Tag label={capitalizeRelationship(link.relationshipType)} />
                </View>
              ))
            )}
          </Card.Body>
        </Card>
      </View>

      {/* Right Column - Segments & Referrals */}
      <View className="flex-1 gap-lg">
        {/* Segments Card */}
        <Card>
          <Card.Head>
            <Text className="text-heading-sm text-color-text-primary">Segments</Text>
            <Pressable>
              <Text className="text-color-brand text-body-sm">Manage</Text>
            </Pressable>
          </Card.Head>
          <Card.Body>
            {isLoadingSegments ? (
              <Text className="text-color-text-muted text-body-sm">Loading segments...</Text>
            ) : !segments || segments.length === 0 ? (
              <Text className="text-color-text-muted text-body-sm">Not in any segments</Text>
            ) : (
              <View className="flex-row flex-wrap gap-sm">
                {segments.map((segment) => (
                  <Chip 
                    key={segment.id} 
                    label={segment.name.en}
                    variant="default"
                  />
                ))}
              </View>
            )}
          </Card.Body>
        </Card>

        {/* Referrals Card */}
        <Card>
          <Card.Head>
            <Text className="text-heading-sm text-color-text-primary">Referrals</Text>
          </Card.Head>
          <Card.Body>
            <View className="gap-sm">
              <RowKV
                label="Referred by"
                value={referralData.referredBy || '—'}
              />
              <RowKV
                label="Has referred"
                value={
                  referralData.hasReferred.count > 0
                    ? `${referralData.hasReferred.count} ${
                        referralData.hasReferred.count === 1 ? 'person' : 'people'
                      }`
                    : '—'
                }
              />
              <RowKV
                label="Credits earned"
                value={referralData.creditsEarned > 0 ? `$${referralData.creditsEarned}` : '—'}
              />
            </View>
          </Card.Body>
        </Card>
      </View>
    </View>
  );
}
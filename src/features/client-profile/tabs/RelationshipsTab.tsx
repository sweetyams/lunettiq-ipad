import { View, Text } from 'react-native';
import { useClientLinks, useClientSegments } from '@/src/api/useClients';
import { Avatar } from '@/src/ui/Avatar';
import { Badge, ListRow, Section, formatDate } from '@/src/ui/kit';
import type { ClientLink } from '@/src/api/clients.types';

interface RelationshipsTabProps {
  clientId: string;
  onLinkClient: () => void;
  onOpenClient: (clientId: string) => void;
}

function linkedName(c: ClientLink['linkedClient']): string {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'No name yet';
}

export function RelationshipsTab({ clientId, onLinkClient, onOpenClient }: RelationshipsTabProps) {
  const { data: links, isLoading: linksLoading } = useClientLinks(clientId);
  const { data: segments, isLoading: segmentsLoading } = useClientSegments(clientId);
  const list = links ?? [];

  return (
    <View className="flex-row gap-[20px] items-start">
      <View className="flex-[3]">
        <Section title="Linked clients" count={list.length || undefined} padded={list.length === 0} action={{ label: 'Link a client', onPress: onLinkClient }}>
          {linksLoading ? (
            <Text className="text-body-sm text-text-tertiary">Loading…</Text>
          ) : list.length === 0 ? (
            <Text className="text-body-sm text-text-tertiary">
              Link family members or partners to see who shops together.
            </Text>
          ) : (
            list.map((link, i) => (
              <ListRow
                key={link.id}
                divider={i > 0}
                onPress={() => onOpenClient(link.linkedClient.id)}
                chevron
                leading={<Avatar size="md" firstName={link.linkedClient.firstName ?? ''} lastName={link.linkedClient.lastName ?? ''} />}
                title={linkedName(link.linkedClient)}
                subtitle={`Linked ${formatDate(link.createdAt) ?? ''}`}
                trailing={<Badge>{link.relationshipType.charAt(0).toUpperCase() + link.relationshipType.slice(1)}</Badge>}
                accessibilityLabel={`${linkedName(link.linkedClient)}, ${link.relationshipType}`}
              />
            ))
          )}
        </Section>
      </View>

      <View className="flex-[2]">
        <Section title="Segments" count={segments?.length || undefined}>
          {segmentsLoading ? (
            <Text className="text-body-sm text-text-tertiary">Loading…</Text>
          ) : !segments?.length ? (
            <Text className="text-body-sm text-text-tertiary">Not in any segments.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-[6px]">
              {[...new Set(segments.map((s) => s.name.en))].map((name) => <Badge key={name} tone="outline">{name}</Badge>)}
            </View>
          )}
        </Section>
      </View>
    </View>
  );
}

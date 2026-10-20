import { View, Text } from 'react-native';
import { useState } from 'react';
import { Sheet, Field, ChoiceChips, ListRow, Badge } from '@/src/ui/kit';
import { ClientSearch, clientName } from '@/src/features/clients/ClientSearch';
import { Avatar } from '@/src/ui/Avatar';
import { useCreateClientLink } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';
import type { Client, RelationshipType } from '@/src/api/clients.types';

interface LinkClientSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const TYPES: Array<{ key: RelationshipType; label: string }> = [
  { key: 'spouse', label: 'Spouse' },
  { key: 'partner', label: 'Partner' },
  { key: 'parent', label: 'Parent' },
  { key: 'child', label: 'Child' },
  { key: 'sibling', label: 'Sibling' },
  { key: 'colleague', label: 'Colleague' },
  { key: 'other', label: 'Other' },
];

const nameOf = clientName;
const memberTag = (c: Client) => c.tags?.find((t) => t.startsWith('member-'))?.replace('member-', '').toUpperCase();

export function LinkClientSheet({ clientId, visible, onClose }: LinkClientSheetProps) {
  const [picked, setPicked] = useState<Client | null>(null);
  const [type, setType] = useState<RelationshipType | null>(null);
  const createLink = useCreateClientLink();

  const save = async () => {
    if (!picked || !type) return;
    try {
      await createLink.mutateAsync({ clientId, linkedClientId: picked.id, relationshipType: type });
      toast.success('Linked', `${nameOf(picked)} added to relationships.`);
      onClose();
    } catch {
      toast.error('Couldn’t link', 'Check the connection and try again.');
    }
  };

  // Step 1: find the client with the whole sheet (results stay visible above the keyboard).
  if (!picked) {
    return (
      <Sheet visible={visible} onClose={onClose} title="Link a client" subtitle="Family or partners who shop together." fill scroll={false}>
        <ClientSearch
          onPick={setPicked}
          excludeIds={[clientId]}
          trailing={(c) => (memberTag(c) ? <Badge tone="info">{memberTag(c)}</Badge> : null)}
        />
      </Sheet>
    );
  }

  // Step 2: relationship.
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Link a client"
      subtitle="Family or partners who shop together."
      primary={{ label: 'Link client', onPress: save, disabled: !type, loading: createLink.isPending }}
    >
      <View className="gap-[20px]">
        <Field label="Client">
          <View className="border border-border rounded-md">
            <ListRow
              divider={false}
              leading={<Avatar size="sm" firstName={picked.firstName ?? ''} lastName={picked.lastName ?? ''} />}
              title={nameOf(picked)}
              subtitle={picked.email ?? undefined}
              trailing={<Text className="text-body-sm font-medium text-text-primary" onPress={() => setPicked(null)} accessibilityRole="button">Change</Text>}
            />
          </View>
        </Field>
        <Field label="Relationship">
          <ChoiceChips options={TYPES} value={type} onChange={setType} />
        </Field>
      </View>
    </Sheet>
  );
}

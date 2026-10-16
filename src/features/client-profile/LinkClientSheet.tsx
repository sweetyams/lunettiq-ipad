import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { Sheet, TextField, Field, ChoiceChips, ListRow, Badge } from '@/src/ui/kit';
import { Avatar } from '@/src/ui/Avatar';
import { useClients, useCreateClientLink } from '@/src/api/useClients';
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

const nameOf = (c: Client) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'No name yet';

export function LinkClientSheet({ clientId, visible, onClose }: LinkClientSheetProps) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<Client | null>(null);
  const [type, setType] = useState<RelationshipType | null>(null);
  const createLink = useCreateClientLink();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useClients(debounced.length >= 2 ? { q: debounced, limit: 6 } : { limit: 0 });
  const results = debounced.length >= 2 ? (data?.clients ?? []).filter((c) => c.id !== clientId) : [];

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

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Link a client"
      subtitle="Family or partners who shop together."
      primary={{ label: 'Link client', onPress: save, disabled: !picked || !type, loading: createLink.isPending }}
    >
      <View className="gap-[20px]">
        {picked ? (
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
        ) : (
          <View className="gap-[8px]">
            <TextField label="Find a client" value={query} onChangeText={setQuery} placeholder="Name, email or phone" autoCapitalize="none" autoCorrect={false} autoFocus />
            {debounced.length >= 2 ? (
              <View className="border border-border rounded-md overflow-hidden">
                {results.length === 0 ? (
                  <Text className="text-body-sm text-text-tertiary px-[16px] py-[14px]">{isFetching ? 'Searching…' : 'No matching clients.'}</Text>
                ) : (
                  results.map((c, i) => (
                    <ListRow
                      key={c.id}
                      divider={i > 0}
                      onPress={() => setPicked(c)}
                      leading={<Avatar size="sm" firstName={c.firstName ?? ''} lastName={c.lastName ?? ''} />}
                      title={nameOf(c)}
                      subtitle={c.email ?? undefined}
                      trailing={c.tags?.some((t) => t.startsWith('member-')) ? <Badge tone="info">{c.tags.find((t) => t.startsWith('member-'))!.replace('member-', '').toUpperCase()}</Badge> : undefined}
                    />
                  ))
                )}
              </View>
            ) : null}
          </View>
        )}
        <Field label="Relationship">
          <ChoiceChips options={TYPES} value={type} onChange={setType} />
        </Field>
      </View>
    </Sheet>
  );
}

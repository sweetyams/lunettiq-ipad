import { View, Text } from 'react-native';
import { useState } from 'react';
import { Plus } from 'lucide-react-native';
import { Sheet, TextField, Field, ChoiceChips, Button } from '@/src/ui/kit';
import { useUpdateClient } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';

interface TagManagementSheetProps {
  clientId: string;
  currentTags: string[];
  visible: boolean;
  onClose: () => void;
}

const SUGGESTED = ['VIP', 'Price sensitive', 'Referred', 'Multi-pair candidate', 'Insurance-led', 'Second pair interest'];
// Membership tier tags are managed by loyalty, not by hand.
const isSystem = (t: string) => t.startsWith('member-');

export function TagManagementSheet({ clientId, currentTags, visible, onClose }: TagManagementSheetProps) {
  const system = currentTags.filter(isSystem);
  const initial = [...new Set(currentTags.filter((t) => !isSystem(t)))];
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState('');
  const updateClient = useUpdateClient();

  const options = [...new Set([...initial, ...SUGGESTED, ...tags])];
  const changed = [...tags].sort().join('|') !== [...initial].sort().join('|');

  const add = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setDraft('');
  };

  const save = async () => {
    try {
      await updateClient.mutateAsync({ id: clientId, data: { tags: [...system, ...tags] } });
      toast.success('Tags saved');
      onClose();
    } catch {
      toast.error('Couldn’t save tags', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Tags"
      subtitle="Selected tags are saved on the client. Tap to add or remove."
      primary={{ label: 'Save tags', onPress: save, disabled: !changed, loading: updateClient.isPending }}
    >
      <View className="gap-[20px]">
        <Field label="Tags">
          <ChoiceChips multiple options={options} value={tags} onChange={setTags} />
        </Field>
        <View className="flex-row items-end gap-[8px]">
          <TextField className="flex-1" label="New tag" value={draft} onChangeText={setDraft} onSubmitEditing={add} returnKeyType="done" placeholder="e.g. Sun lover" />
          <Button label="Add" icon={Plus} onPress={add} disabled={!draft.trim()} />
        </View>
        {system.length ? (
          <Text className="text-body-sm text-text-tertiary">Membership tier ({system.map((t) => t.replace('member-', '').toUpperCase()).join(', ')}) is kept as is.</Text>
        ) : null}
      </View>
    </Sheet>
  );
}

import { View, Text } from 'react-native';
import { useState } from 'react';
import { Sheet, TextField, Field, ChoiceChips } from '@/src/ui/kit';
import { useUpdateEnrichment } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';

interface NotesEditSheetProps {
  clientId: string;
  currentNotes: string | null;
  visible: boolean;
  onClose: () => void;
}

const QUICK = ['Follow up', 'Price sensitive', 'Bring partner', 'Size up'] as const;

export function NotesEditSheet({ clientId, currentNotes, visible, onClose }: NotesEditSheetProps) {
  const [notes, setNotes] = useState(currentNotes || '');
  const updateEnrichment = useUpdateEnrichment();

  const append = (tag: string | null) => {
    if (!tag) return;
    setNotes((n) => (n.trim() ? `${n.trim()}\n${tag}` : tag));
  };

  const save = async () => {
    try {
      await updateEnrichment.mutateAsync({ clientId, data: { internalNotes: notes.trim() || null } });
      toast.success('Notes saved');
      onClose();
    } catch {
      toast.error('Couldn’t save notes', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Internal notes"
      subtitle="Staff only. Never shown in client view."
      primary={{ label: 'Save notes', onPress: save, disabled: notes === (currentNotes || ''), loading: updateEnrichment.isPending }}
    >
      <View className="gap-[20px]">
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Anything the next person serving them should know" multiline autoFocus />
        <Field label="Add a line">
          <ChoiceChips options={QUICK} value={null} onChange={append} />
          <Text className="text-body-sm text-text-tertiary">Tap to append to the notes.</Text>
        </Field>
      </View>
    </Sheet>
  );
}

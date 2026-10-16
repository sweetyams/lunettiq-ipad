import { View } from 'react-native';
import { useState } from 'react';
import { Sheet, TextField } from '@/src/ui/kit';
import { useCreateInteraction } from '@/src/api/useInteractions';
import { toast } from '@/src/ui/useToastStore';

interface ClinicalNotesSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

/** Clinical notes are interactions tagged `category: clinical` (read back on the Clinical tab). */
export function ClinicalNotesSheet({ clientId, visible, onClose }: ClinicalNotesSheetProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const createInteraction = useCreateInteraction();

  const save = async () => {
    try {
      await createInteraction.mutateAsync({
        clientId,
        type: 'note',
        direction: 'internal',
        subject: subject.trim() || 'Clinical note',
        body: body.trim(),
        metadata: { category: 'clinical' },
      });
      toast.success('Clinical note saved');
      onClose();
    } catch {
      toast.error('Couldn’t save the note', 'Check the connection and try again. Your text is still here.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add clinical note"
      subtitle="Staff only. Never shown in client view or client messages."
      primary={{ label: 'Save note', onPress: save, disabled: !body.trim(), loading: createInteraction.isPending }}
    >
      <View className="gap-[20px]">
        <TextField label="Note" required value={body} onChangeText={setBody} placeholder="Observations, recommendations, follow-up" multiline autoFocus />
        <TextField label="Subject" hint="Optional." value={subject} onChangeText={setSubject} placeholder="e.g. Progressive adaptation" />
      </View>
    </Sheet>
  );
}

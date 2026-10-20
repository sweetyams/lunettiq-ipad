import { View } from 'react-native';
import { useState } from 'react';
import { Sheet, TextField, Field, ChoiceChips } from '@/src/ui/kit';
import { useCreateInteraction } from '@/src/api/useInteractions';
import { toast } from '@/src/ui/useToastStore';

interface AddNoteSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const QUICK_TAGS = ['Follow up needed', 'Price sensitive', 'Discussed insurance', 'Rx follow up'] as const;

export function AddNoteSheet({ clientId, visible, onClose }: AddNoteSheetProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const createInteraction = useCreateInteraction();

  const save = async () => {
    try {
      const res = await createInteraction.mutateAsync({
        clientId,
        type: 'note',
        direction: 'internal',
        subject: [subject.trim(), ...tags].filter(Boolean).join(' · ') || undefined,
        body: body.trim(),
        metadata: tags.length ? { tags } : undefined,
      });
      if (res && 'queued' in res) toast.info('Note saved on this iPad', 'It syncs to the client’s history when back online.');
      else toast.success('Note saved', 'It’s on the client’s history.');
      onClose();
    } catch {
      toast.error('Couldn’t save the note', 'Check the connection and try again. Your text is still here.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add note"
      subtitle="Staff only. Appears in the client’s history."
      primary={{ label: 'Save note', onPress: save, disabled: !body.trim(), loading: createInteraction.isPending }}
    >
      <View className="gap-[20px]">
        <TextField label="Note" required value={body} onChangeText={setBody} placeholder="What happened, what they liked, what to do next" multiline autoFocus />
        <Field label="Tags">
          <ChoiceChips multiple options={QUICK_TAGS} value={tags} onChange={setTags} />
        </Field>
        <TextField label="Subject" hint="Optional. A short line for the timeline." value={subject} onChangeText={setSubject} placeholder="e.g. Second pair for driving" />
      </View>
    </Sheet>
  );
}

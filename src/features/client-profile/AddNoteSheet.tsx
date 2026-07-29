import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useCreateInteraction } from '@/src/api/useInteractions';

interface AddNoteSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const QUICK_TAGS = [
  'Follow up needed',
  'Price sensitive',
  'Discussed insurance',
  'Rx follow up',
];

export function AddNoteSheet({ clientId, visible, onClose }: AddNoteSheetProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const createInteraction = useCreateInteraction();

  const handleTagPress = (tag: string) => {
    if (subject.includes(tag)) return;
    
    const newSubject = subject ? `${subject}, ${tag}` : tag;
    setSubject(newSubject);
  };

  const handleSave = async () => {
    if (!body.trim()) return;
    
    setIsSaving(true);
    try {
      await createInteraction.mutateAsync({
        clientId,
        type: 'note',
        direction: 'internal',
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      
      // Reset form
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Add note"
      footer={
        <View className="flex-row gap-md">
          <Button
            variant="ghost"
            onPress={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={!body.trim() || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save note'}
          </Button>
        </View>
      }
    >
      <View className="gap-lg">
        <View className="gap-sm">
          <FieldLabel>Subject (optional)</FieldLabel>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary..."
            className="bg-color-bg-surface border border-color-border rounded-md p-md text-body-lg text-color-text-primary"
            multiline={false}
          />
        </View>

        <View className="gap-sm">
          <FieldLabel>Quick tags</FieldLabel>
          <View className="flex-row flex-wrap gap-sm">
            {QUICK_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                variant={subject.includes(tag) ? 'on' : 'default'}
                onPress={() => handleTagPress(tag)}
              />
            ))}
          </View>
        </View>

        <View className="gap-sm">
          <FieldLabel required>Note</FieldLabel>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Enter your note here..."
            className="bg-color-bg-surface border border-color-border rounded-md p-md text-body-lg text-color-text-primary min-h-[120px]"
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>
    </Sheet>
  );
}
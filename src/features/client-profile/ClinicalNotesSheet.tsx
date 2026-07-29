import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Sheet, FieldLabel, Button } from '@/src/ui';
import { useCreateInteraction } from '@/src/api/useInteractions';

interface ClinicalNotesSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function ClinicalNotesSheet({ clientId, visible, onClose }: ClinicalNotesSheetProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const createInteraction = useCreateInteraction();

  const handleSave = async () => {
    if (!body.trim()) {
      return; // Don't save empty notes
    }

    try {
      await createInteraction.mutateAsync({
        clientId,
        type: 'note',
        direction: 'internal',
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      
      // Clear form and close
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Failed to create clinical note:', error);
    }
  };

  const handleCancel = () => {
    // Clear form and close
    setSubject('');
    setBody('');
    onClose();
  };

  const isValid = body.trim().length > 0;

  const footer = (
    <View className="flex-row gap-md">
      <Button variant="quiet" onPress={handleCancel}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onPress={handleSave} 
        disabled={!isValid || createInteraction.isPending}
      >
        {createInteraction.isPending ? 'Saving...' : 'Save note'}
      </Button>
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={handleCancel}
      title="Add clinical note"
      subtitle="Recorded to timeline as staff-only"
      footer={footer}
    >
      <View className="gap-lg">
        {/* Subject line */}
        <View>
          <FieldLabel>Subject (optional)</FieldLabel>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Progressive lens adaptation, Eye strain concerns"
            className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
          />
        </View>

        {/* Body */}
        <View>
          <FieldLabel>Clinical note</FieldLabel>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Enter clinical observations, recommendations, or follow-up notes..."
            multiline
            textAlignVertical="top"
            className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[88px] text-body-md text-color-text-primary"
          />
        </View>

        {/* Helper text */}
        <View className="bg-color-bg-muted p-md rounded-sm">
          <Text className="text-body-sm text-color-text-secondary">
            Clinical notes are added to the client timeline and are only visible to staff members. 
            This information will not appear in client-facing communications.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useUpdateEnrichment } from '@/src/api/useClients';

interface NotesEditSheetProps {
  clientId: string;
  currentNotes: string | null;
  visible: boolean;
  onClose: () => void;
}

export function NotesEditSheet({ clientId, currentNotes, visible, onClose }: NotesEditSheetProps) {
  const [notes, setNotes] = useState(currentNotes || '');

  const updateEnrichment = useUpdateEnrichment();

  const quickTags = ['Follow up', 'Price sensitive', 'Bring spouse', 'Size up'];

  const handleQuickTag = (tag: string) => {
    const currentText = notes.trim();
    const newText = currentText ? `${currentText}\n\n${tag}` : tag;
    setNotes(newText);
  };

  const handleSave = async () => {
    try {
      await updateEnrichment.mutateAsync({
        clientId,
        data: {
          internalNotes: notes.trim() || null,
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleCancel = () => {
    // Reset to original notes
    setNotes(currentNotes || '');
    onClose();
  };

  const footer = (
    <View className="flex-row gap-md">
      <Button variant="quiet" onPress={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onPress={handleSave} disabled={updateEnrichment.isPending}>
        {updateEnrichment.isPending ? 'Saving...' : 'Save notes'}
      </Button>
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={handleCancel}
      title="Internal notes"
      subtitle="Staff only — never shown in client view"
      footer={footer}
    >
      <View className="gap-lg">
        {/* Notes textarea */}
        <View>
          <FieldLabel>Notes</FieldLabel>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add internal notes about this client..."
            multiline
            textAlignVertical="top"
            className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[88px] text-body-md text-color-text-primary"
          />
        </View>

        {/* Quick tags */}
        <View>
          <FieldLabel>Quick tags</FieldLabel>
          <Text className="text-body-sm text-color-text-secondary mb-sm">
            Tap to append to notes
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {quickTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                variant="default"
                onPress={() => handleQuickTag(tag)}
              />
            ))}
          </View>
        </View>
      </View>
    </Sheet>
  );
}
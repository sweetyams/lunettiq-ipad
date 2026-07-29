import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useUpdateClient } from '@/src/api/useClients';

interface TagManagementSheetProps {
  clientId: string;
  currentTags: string[];
  visible: boolean;
  onClose: () => void;
}

const SUGGESTED_TAGS = [
  'VIP',
  'Price sensitive',
  'Referred',
  'Multi-pair candidate',
  'Insurance-led',
  'Second pair interest',
];

export function TagManagementSheet({ 
  clientId, 
  currentTags, 
  visible, 
  onClose 
}: TagManagementSheetProps) {
  const [localTags, setLocalTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const updateClient = useUpdateClient();

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag || localTags.includes(trimmedTag)) return;
    
    setLocalTags(prev => [...prev, trimmedTag]);
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setLocalTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestedTagPress = (tag: string) => {
    if (!localTags.includes(tag)) {
      addTag(tag);
    }
  };

  const handleAddNewTag = () => {
    if (newTag.trim()) {
      addTag(newTag);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateClient.mutateAsync({ 
        id: clientId, 
        data: { tags: localTags } 
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update tags:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setLocalTags(currentTags);
    setNewTag('');
    onClose();
  };

  const hasChanges = JSON.stringify(localTags.sort()) !== JSON.stringify(currentTags.sort());

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Manage tags"
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
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save tags'}
          </Button>
        </View>
      }
    >
      <View className="gap-lg">
        {localTags.length > 0 && (
          <View className="gap-sm">
            <FieldLabel>Current tags</FieldLabel>
            <View className="flex-row flex-wrap gap-sm">
              {localTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="on"
                  onPress={() => removeTag(tag)}
                />
              ))}
            </View>
          </View>
        )}

        <View className="h-px bg-color-border" />

        <View className="gap-sm">
          <FieldLabel>Add tag</FieldLabel>
          <View className="flex-row gap-sm">
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Enter tag name..."
              className="flex-1 bg-color-bg-surface border border-color-border rounded-md p-md text-body-lg text-color-text-primary"
              onSubmitEditing={handleAddNewTag}
              returnKeyType="done"
            />
            <Button
              variant="ghost"
              onPress={handleAddNewTag}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </View>
        </View>

        <View className="gap-sm">
          <FieldLabel>Suggested tags</FieldLabel>
          <View className="flex-row flex-wrap gap-sm">
            {SUGGESTED_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                variant={localTags.includes(tag) ? 'on' : 'default'}
                onPress={() => handleSuggestedTagPress(tag)}
              />
            ))}
          </View>
        </View>
      </View>
    </Sheet>
  );
}
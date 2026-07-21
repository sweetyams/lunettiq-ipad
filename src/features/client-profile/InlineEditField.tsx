import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Pencil, Check, X } from 'lucide-react-native';

interface InlineEditFieldProps {
  label: string;
  value: string | null;
  onSave: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
}

export function InlineEditField({
  label,
  value,
  onSave,
  placeholder = 'Not set',
  editable = true,
  multiline = false,
  keyboardType = 'default',
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const handleEdit = useCallback(() => {
    setDraft(value ?? '');
    setEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    onSave(draft);
    setEditing(false);
  }, [draft, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value ?? '');
    setEditing(false);
  }, [value]);

  if (editing) {
    return (
      <View className="flex-row items-center py-sm">
        <Text className="text-body text-text-muted w-32">{label}</Text>
        <View className="flex-1 flex-row items-center">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder}
            keyboardType={keyboardType}
            multiline={multiline}
            autoFocus
            className="flex-1 text-body text-text-primary border border-border rounded-md px-md py-sm mr-sm"
            placeholderTextColor="#6B6B6B"
          />
          <Pressable
            onPress={handleSave}
            className="min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Save ${label}`}
          >
            <Check color="#005D23" size={20} />
          </Pressable>
          <Pressable
            onPress={handleCancel}
            className="min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Cancel editing ${label}`}
          >
            <X color="#6B6B6B" size={20} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={editable ? handleEdit : undefined}
      className="flex-row items-center py-sm min-h-[44px]"
      accessibilityRole={editable ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value || placeholder}${editable ? '. Tap to edit' : ''}`}
    >
      <Text className="text-body text-text-muted w-32">{label}</Text>
      <Text className={`flex-1 text-body ${value ? 'text-text-primary' : 'text-text-muted italic'}`}>
        {value || placeholder}
      </Text>
      {editable && <Pencil color="#6B6B6B" size={16} />}
    </Pressable>
  );
}

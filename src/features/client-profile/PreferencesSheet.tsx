import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, TextInput, Alert } from 'react-native'; import { Dimensions } from 'react-native';
import { Button } from '@/src/ui/Button';
import { useClientPreferences, useUpdatePreferences } from '@/src/api/useClients';
import { Plus, X } from 'lucide-react-native';

interface PreferencesSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

interface ChipFieldProps {
  label: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  isAvoid?: boolean;
}

function ChipField({ label, values, onAdd, onRemove, isAvoid = false }: ChipFieldProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
      setShowInput(false);
    }
  };

  return (
    <View>
      <Text className="text-heading-sm text-text-primary font-medium mb-md">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-sm">
        {values.map((value, index) => (
          <View
            key={index}
            className={`flex-row items-center px-md py-sm rounded-md border min-h-[44px] ${
              isAvoid 
                ? 'bg-error/10 border-error' 
                : 'bg-bg-inverse border-bg-inverse'
            }`}
          >
            <Text className={`text-body-md ${
              isAvoid 
                ? 'text-error line-through' 
                : 'text-text-inverse'
            }`}>
              {value}
            </Text>
            <Pressable
              onPress={() => onRemove(value)}
              className="ml-xs p-xs min-w-[24px] min-h-[24px] justify-center items-center"
              hitSlop={8}
            >
              <X size={14} color={isAvoid ? '#DC2626' : '#FAFAFA'} />
            </Pressable>
          </View>
        ))}
        
        {showInput ? (
          <View className="flex-row items-center">
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleAdd}
              onBlur={() => setShowInput(false)}
              placeholder="Enter value"
              className="border border-border rounded-md px-md py-sm text-body-md text-text-primary min-w-[120px] min-h-[44px]"
              autoFocus
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setShowInput(true)}
            className="flex-row items-center px-md py-sm rounded-md border border-border bg-bg-surface min-h-[44px]"
          >
            <Plus size={16} color="#737373" />
            <Text className="text-body-md text-text-secondary ml-xs">
              Other
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function PreferencesSheet({ clientId, visible, onClose }: PreferencesSheetProps) {
  const { data: preferences } = useClientPreferences(clientId);
  const updatePreferences = useUpdatePreferences();
  
  const [form, setForm] = useState({
    shapes: [] as string[],
    materials: [] as string[],
    colours: [] as string[],
    brandsAdmired: [] as string[],
    avoid: [] as string[],
    notes: '',
  });

  useEffect(() => {
    if (preferences?.stated) {
      setForm({
        shapes: preferences.stated.shapes || [],
        materials: preferences.stated.materials || [],
        colours: preferences.stated.colours || [],
        brandsAdmired: preferences.stated.brandsAdmired || [],
        avoid: preferences.stated.avoid || [],
        notes: preferences.stated.notes || '',
      });
    }
  }, [preferences]);

  const handleAddToField = (field: keyof typeof form, value: string) => {
    if (field === 'notes') return;
    setForm(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }));
  };

  const handleRemoveFromField = (field: keyof typeof form, value: string) => {
    if (field === 'notes') return;
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = async () => {
    try {
      await updatePreferences.mutateAsync({
        clientId,
        data: form,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View className="bg-bg-surface rounded-lg border border-border w-full max-w-[640px]"  style={{ flex: 1, maxHeight: 720 }}>
          {/* Header */}
          <View className="p-lg border-b border-border">
            <Text className="text-heading-lg text-text-primary font-medium">
              Style Preferences
            </Text>
            <Text className="text-body-md text-text-secondary mt-xs">
              Likes, dislikes, and notes
            </Text>
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-lg gap-xl">
              <ChipField
                label="Shapes"
                values={form.shapes}
                onAdd={(value) => handleAddToField('shapes', value)}
                onRemove={(value) => handleRemoveFromField('shapes', value)}
              />

              <ChipField
                label="Materials"
                values={form.materials}
                onAdd={(value) => handleAddToField('materials', value)}
                onRemove={(value) => handleRemoveFromField('materials', value)}
              />

              <ChipField
                label="Colours"
                values={form.colours}
                onAdd={(value) => handleAddToField('colours', value)}
                onRemove={(value) => handleRemoveFromField('colours', value)}
              />

              <ChipField
                label="Brands admired"
                values={form.brandsAdmired}
                onAdd={(value) => handleAddToField('brandsAdmired', value)}
                onRemove={(value) => handleRemoveFromField('brandsAdmired', value)}
              />

              <ChipField
                label="Avoid"
                values={form.avoid}
                onAdd={(value) => handleAddToField('avoid', value)}
                onRemove={(value) => handleRemoveFromField('avoid', value)}
                isAvoid
              />

              <View>
                <Text className="text-heading-sm text-text-primary font-medium mb-md">
                  Notes
                </Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, notes: text }))}
                  placeholder="Additional style notes and preferences"
                  multiline
                  numberOfLines={4}
                  className="border border-border rounded-md p-md text-body-md text-text-primary bg-bg-surface"
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-lg border-t border-border flex-row justify-end gap-md">
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onPress={handleSubmit}
              loading={updatePreferences.isPending}
            >
              Save Preferences
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
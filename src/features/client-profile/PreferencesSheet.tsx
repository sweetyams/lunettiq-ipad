import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { Sheet, Chip, FieldLabel, Button } from '@/src/ui';
import { useClientPreferences, useUpdatePreferences } from '@/src/api/useClients';
import type { StatedPreferences } from '@/src/api/clients.types';

interface PreferencesSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const PREDEFINED_OPTIONS = {
  shapes: ['Rectangular', 'Square', 'Round', 'Cat-eye', 'Aviator', 'Geometric'],
  materials: ['Acetate', 'Titanium', 'Steel', 'Combination'],
  colours: ['Tortoise', 'Black', 'Crystal', 'Bold colour', 'Metallic'],
  brandsAdmired: ['CHIMI', 'Kaleos', 'Jimmy Fairly', 'Lexxola'],
};

export function PreferencesSheet({ clientId, visible, onClose }: PreferencesSheetProps) {
  const { data: preferences, isLoading } = useClientPreferences(clientId);
  const updatePreferences = useUpdatePreferences();

  const [formData, setFormData] = useState<StatedPreferences>({
    shapes: [],
    materials: [],
    colours: [],
    avoid: [],
    brandsAdmired: [],
    notes: '',
  });

  // Pre-fill from API on mount or when preferences change
  useEffect(() => {
    if (preferences?.stated) {
      setFormData(preferences.stated);
    }
  }, [preferences]);

  const toggleSelection = (category: keyof Omit<StatedPreferences, 'notes'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value],
    }));
  };

  const addCustomOption = (category: keyof Omit<StatedPreferences, 'notes'>) => {
    Alert.prompt(
      'Add Custom Option',
      `Enter a custom ${category.slice(0, -1)}:`,
      (text) => {
        if (text && text.trim() && !formData[category].includes(text.trim())) {
          setFormData(prev => ({
            ...prev,
            [category]: [...prev[category], text.trim()],
          }));
        }
      }
    );
  };

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        clientId,
        data: formData,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const renderChipGroup = (
    category: keyof Omit<StatedPreferences, 'notes'>,
    title: string,
    options: string[],
    isAvoidGroup = false
  ) => (
    <View className="py-md border-b border-color-border">
      <Text className="text-body-md font-medium text-color-text-primary">{title}</Text>
      <View className="flex-row flex-wrap gap-sm mt-[10px]">
        {/* Predefined options */}
        {options.map(option => (
          <Chip
            key={option}
            label={option}
            variant={formData[category].includes(option) ? (isAvoidGroup ? 'neg' : 'on') : 'default'}
            onPress={() => toggleSelection(category, option)}
          />
        ))}
        
        {/* Custom options not in predefined list */}
        {formData[category]
          .filter(item => !options.includes(item))
          .map(customOption => (
            <Chip
              key={customOption}
              label={customOption}
              variant={isAvoidGroup ? 'neg' : 'on'}
              onPress={() => toggleSelection(category, customOption)}
            />
          ))}
        
        {/* Add custom option */}
        <Chip
          label={isAvoidGroup ? '+ Add' : 'Other'}
          variant="add"
          onPress={() => addCustomOption(category)}
        />
      </View>
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title="Edit Preferences">
      <ScrollView className="flex-1 px-lg">
        {/* Shapes */}
        {renderChipGroup('shapes', 'Shapes', PREDEFINED_OPTIONS.shapes)}
        
        {/* Materials */}
        {renderChipGroup('materials', 'Materials', PREDEFINED_OPTIONS.materials)}
        
        {/* Colours */}
        {renderChipGroup('colours', 'Colours', PREDEFINED_OPTIONS.colours)}
        
        {/* Brands Admired */}
        {renderChipGroup('brandsAdmired', 'Brands admired', PREDEFINED_OPTIONS.brandsAdmired)}
        
        {/* Avoid */}
        {renderChipGroup('avoid', 'Avoid', [], true)}
        
        {/* Notes */}
        <View className="py-md">
          <FieldLabel>Notes</FieldLabel>
          <TextInput
            className="bg-color-bg-surface border border-color-border rounded-md p-md text-body-lg text-color-text-primary mt-sm"
            style={{ minHeight: 80 }}
            multiline
            placeholder="Additional preferences or notes..."
            placeholderTextColor="#737373"
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
      
      {/* Footer Actions */}
      <View className="flex-row gap-md p-lg border-t border-color-border">
        <Button
          variant="ghost"
          onPress={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleSave}
          loading={updatePreferences.isPending}
          className="flex-1"
        >
          Save preferences
        </Button>
      </View>
    </Sheet>
  );
}
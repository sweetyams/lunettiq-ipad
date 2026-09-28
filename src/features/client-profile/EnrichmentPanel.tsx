import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Glasses, Pencil, Check, X, MapPin } from 'lucide-react-native';
import { useClientEnrichment, useUpdateEnrichment } from '@/src/api/useClients';
import { useLocations, locationName } from '@/src/api/useLocations';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Card, LoadingState } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import { LocationPickerSheet } from './LocationPickerSheet';
import type { EnrichmentUpdateParams } from '@/src/api/clients.types';

interface EnrichmentPanelProps {
  clientId: string;
}

export function EnrichmentPanel({ clientId }: EnrichmentPanelProps) {
  const { data: enrichment, isLoading } = useClientEnrichment(clientId);
  const { data: locations } = useLocations();
  const updateEnrichment = useUpdateEnrichment();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleStartEdit = useCallback((field: string, currentValue: string | number | null) => {
    setEditingField(field);
    setDraftValue(currentValue != null ? String(currentValue) : '');
  }, []);

  const handlePickLocation = useCallback((locationId: string) => {
    const data: EnrichmentUpdateParams = { homeLocationId: locationId };
    
    updateEnrichment.mutate(
      { clientId, data },
      {
        onSuccess: () => {
          toast.success('Home location updated');
        },
        onError: () => {
          toast.error('Failed to update location');
        },
      }
    );
  }, [clientId, updateEnrichment]);

  const handleSave = useCallback(
    (field: string) => {
      const data: EnrichmentUpdateParams = {};
      if (field === 'faceShape') data.faceShape = draftValue || null;
      if (field === 'frameWidthMm') data.frameWidthMm = draftValue ? Number(draftValue) : null;
      if (field === 'bridgeWidthMm') data.bridgeWidthMm = draftValue ? Number(draftValue) : null;
      if (field === 'internalNotes') data.internalNotes = draftValue || null;

      updateEnrichment.mutate(
        { clientId, data },
        {
          onSuccess: () => {
            setEditingField(null);
            toast.success('Enrichment updated');
          },
          onError: () => {
            toast.error('Failed to update');
          },
        }
      );
    },
    [clientId, draftValue, updateEnrichment]
  );

  if (isLoading) return <Card><LoadingState /></Card>;

  const selectedLocation = locations?.find(loc => loc.id === enrichment?.homeLocationId);

  const rows: Array<{
    key: string;
    label: string;
    value: string | number | null;
    suffix?: string;
    numeric?: boolean;
    picker?: boolean;
  }> = [
    { key: 'faceShape', label: 'Face shape', value: enrichment?.faceShape ?? null },
    { key: 'frameWidthMm', label: 'Frame width', value: enrichment?.frameWidthMm ?? null, suffix: 'mm', numeric: true },
    { key: 'bridgeWidthMm', label: 'Bridge width', value: enrichment?.bridgeWidthMm ?? null, suffix: 'mm', numeric: true },
    { 
      key: 'homeLocation', 
      label: 'Home location', 
      value: selectedLocation ? locationName(selectedLocation) : null, 
      picker: true 
    },
  ];

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Glasses color="#6B6B6B" size={20} />
        <Text className="text-heading-xl text-text-primary font-semibold ml-sm">Fit Profile</Text>
      </View>

      <Card>
        {rows.map((row, index) => (
          <View
            key={row.key}
            className={`flex-row items-center py-md ${
              index < rows.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            {editingField === row.key ? (
              <>
                <Text className="text-body-md text-text-muted w-32">{row.label}</Text>
                <TextInput
                  value={draftValue}
                  onChangeText={setDraftValue}
                  keyboardType={row.numeric ? 'numeric' : 'default'}
                  autoFocus
                  className="flex-1 text-body-md text-text-primary border border-border rounded-md px-md py-sm"
                  placeholder={`Enter ${row.label.toLowerCase()}`}
                  placeholderTextColor="#6B6B6B"
                />
                <Pressable
                  onPress={() => handleSave(row.key)}
                  className="min-w-[44px] min-h-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Save ${row.label}`}
                >
                  <Check color="#005D23" size={20} />
                </Pressable>
                <Pressable
                  onPress={() => setEditingField(null)}
                  className="min-w-[44px] min-h-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <X color="#6B6B6B" size={20} />
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => {
                  if (row.picker) {
                    setShowLocationPicker(true);
                  } else {
                    handleStartEdit(row.key, row.value);
                  }
                }}
                className="flex-1 flex-row items-center min-h-[44px]"
                accessibilityRole="button"
                accessibilityLabel={
                  row.picker
                    ? `${row.label}: ${row.value || 'Not set'}. Tap to select location`
                    : `${row.label}: ${row.value ? `${row.value}${row.suffix ?? ''}` : 'Not measured'}. Tap to edit`
                }
              >
                <Text className="text-body-md text-text-muted w-32">{row.label}</Text>
                <Text
                  className={`flex-1 text-body-md font-medium ${
                    row.value != null ? 'text-text-primary' : 'text-text-muted italic'
                  }`}
                >
                  {row.value != null 
                    ? `${row.value}${row.suffix ?? ''}` 
                    : (row.picker ? 'Not set' : 'Not measured')
                  }
                </Text>
                {row.picker ? (
                  <MapPin color="#6B6B6B" size={16} />
                ) : (
                  <Pencil color="#6B6B6B" size={16} />
                )}
              </Pressable>
            )}
          </View>
        ))}

        {/* Internal notes — staff only */}
        {privacyMode === 'staff' && (
          <View className="pt-md mt-md border-t border-border">
            <Text className="text-body-md font-medium text-text-primary mb-sm">Internal Notes</Text>
            {editingField === 'internalNotes' ? (
              <View>
                <TextInput
                  value={draftValue}
                  onChangeText={setDraftValue}
                  multiline
                  numberOfLines={4}
                  className="text-body-md text-text-primary border border-border rounded-md px-md py-sm min-h-[88px]"
                  placeholder="Add internal notes..."
                  placeholderTextColor="#6B6B6B"
                  textAlignVertical="top"
                />
                <View className="flex-row justify-end mt-sm gap-sm">
                  <Pressable
                    onPress={() => setEditingField(null)}
                    className="min-h-[44px] px-lg items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                  >
                    <Text className="text-body-md text-text-muted">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSave('internalNotes')}
                    className="min-h-[44px] px-lg bg-accent rounded-md items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel="Save notes"
                  >
                    <Text className="text-body-md font-medium text-text-inverse">Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => handleStartEdit('internalNotes', enrichment?.internalNotes ?? null)}
                className="min-h-[44px]"
                accessibilityRole="button"
                accessibilityLabel="Edit internal notes"
              >
                <Text className={`text-body ${enrichment?.internalNotes ? 'text-text-primary' : 'text-text-muted italic'}`}>
                  {enrichment?.internalNotes || 'No notes yet. Tap to add.'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Empty state */}
        {!enrichment?.faceShape && !enrichment?.frameWidthMm && (
          <View className="mt-md p-md bg-bg-page rounded-md">
            <Text className="text-body-md text-text-muted text-center">
              Start a fitting session to capture measurements
            </Text>
          </View>
        )}
      </Card>

      {/* Location Picker Sheet */}
      <LocationPickerSheet
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handlePickLocation}
        selectedLocationId={enrichment?.homeLocationId}
      />
    </View>
  );
}

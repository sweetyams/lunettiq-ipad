import { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Heart, Pencil, Plus, X } from 'lucide-react-native';
import { useClientPreferences, useUpdatePreferences } from '@/src/api/useClients';
import { Card, LoadingState } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import type { StatedPreferences } from '@/src/api/clients.types';

interface PreferencesPanelProps {
  clientId: string;
}

const EMPTY_STATED: StatedPreferences = {
  shapes: [],
  materials: [],
  colours: [],
  avoid: [],
  brandsAdmired: [],
  notes: '',
};

export function PreferencesPanel({ clientId }: PreferencesPanelProps) {
  const { data: preferences, isLoading } = useClientPreferences(clientId);
  const updatePreferences = useUpdatePreferences();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StatedPreferences>(EMPTY_STATED);

  const handleStartEdit = useCallback(() => {
    setDraft(preferences?.stated ?? EMPTY_STATED);
    setEditing(true);
  }, [preferences]);

  const handleSave = useCallback(() => {
    updatePreferences.mutate(
      { clientId, data: draft },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Preferences updated');
        },
        onError: () => toast.error('Failed to update preferences'),
      }
    );
  }, [clientId, draft, updatePreferences]);

  if (isLoading) return <Card><LoadingState /></Card>;

  const stated = preferences?.stated ?? EMPTY_STATED;
  const derived = preferences?.derived;

  return (
    <View>
      <View className="flex-row items-center mb-md">
        <Heart color="#6B6B6B" size={20} />
        <Text className="text-headline text-text-primary font-semibold ml-sm">Preferences</Text>
        {!editing && (
          <Pressable
            onPress={handleStartEdit}
            className="ml-auto min-w-[44px] min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Edit preferences"
          >
            <Pencil color="#6B6B6B" size={18} />
          </Pressable>
        )}
      </View>

      <Card>
        {editing ? (
          <PreferencesEditForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={updatePreferences.isPending}
          />
        ) : (
          <View>
            {/* Stated preferences */}
            <Text className="text-bodyStrong text-text-primary mb-sm">Stated</Text>
            <PreferenceRow label="Shapes" items={stated.shapes} />
            <PreferenceRow label="Materials" items={stated.materials} />
            <PreferenceRow label="Colours" items={stated.colours} />
            <PreferenceRow label="Avoid" items={stated.avoid} />
            <PreferenceRow label="Brands" items={stated.brandsAdmired} />
            {stated.notes ? (
              <View className="mt-sm">
                <Text className="text-caption text-text-muted">Notes</Text>
                <Text className="text-body text-text-primary mt-xs">{stated.notes}</Text>
              </View>
            ) : null}

            {/* Derived preferences */}
            {derived && (
              <View className="mt-lg pt-lg border-t border-border">
                <Text className="text-bodyStrong text-text-primary mb-sm">Derived (from history)</Text>
                <DerivedRow label="Shapes" data={derived.derivedShapes} />
                <DerivedRow label="Materials" data={derived.derivedMaterials} />
                <DerivedRow label="Colours" data={derived.derivedColours} />
                {derived.derivedPriceRange && (
                  <View className="flex-row items-center mt-sm">
                    <Text className="text-body text-text-muted w-24">Price range</Text>
                    <Text className="text-body text-text-primary">
                      ${derived.derivedPriceRange.min} – ${derived.derivedPriceRange.max} (avg ${derived.derivedPriceRange.avg})
                    </Text>
                  </View>
                )}
                <Text className="text-caption text-text-muted mt-sm">
                  Based on {derived.sourceOrderCount} orders
                  {derived.lastComputedAt ? ` · Updated ${new Date(derived.lastComputedAt).toLocaleDateString()}` : ''}
                </Text>
              </View>
            )}

            {/* Empty state */}
            {stated.shapes.length === 0 &&
              stated.materials.length === 0 &&
              stated.colours.length === 0 &&
              !derived && (
                <Text className="text-body text-text-muted italic text-center py-md">
                  No preferences recorded yet
                </Text>
              )}
          </View>
        )}
      </Card>
    </View>
  );
}

function PreferenceRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View className="flex-row items-start mt-sm">
      <Text className="text-body text-text-muted w-24">{label}</Text>
      <View className="flex-1 flex-row flex-wrap gap-xs">
        {items.map((item) => (
          <View key={item} className="bg-bg-page px-sm py-xs rounded-md">
            <Text className="text-caption text-text-primary">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DerivedRow({ label, data }: { label: string; data: Record<string, number> }) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5);
  if (sorted.length === 0) return null;
  return (
    <View className="flex-row items-start mt-sm">
      <Text className="text-body text-text-muted w-24">{label}</Text>
      <View className="flex-1 flex-row flex-wrap gap-xs">
        {sorted.map(([name, score]) => (
          <View key={name} className="bg-bg-page px-sm py-xs rounded-md flex-row items-center">
            <Text className="text-caption text-text-primary">{name}</Text>
            <Text className="text-caption text-text-muted ml-xs">({Math.round(score * 100)}%)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Edit Form ───────────────────────────────────────────────

interface PreferencesEditFormProps {
  draft: StatedPreferences;
  onChange: (prefs: StatedPreferences) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function PreferencesEditForm({ draft, onChange, onSave, onCancel, saving }: PreferencesEditFormProps) {
  const [newItemField, setNewItemField] = useState<string | null>(null);
  const [newItemValue, setNewItemValue] = useState('');

  const addItem = useCallback(
    (field: keyof Omit<StatedPreferences, 'notes'>) => {
      if (!newItemValue.trim()) return;
      onChange({ ...draft, [field]: [...draft[field], newItemValue.trim()] });
      setNewItemValue('');
      setNewItemField(null);
    },
    [draft, newItemValue, onChange]
  );

  const removeItem = useCallback(
    (field: keyof Omit<StatedPreferences, 'notes'>, index: number) => {
      const arr = [...draft[field]];
      arr.splice(index, 1);
      onChange({ ...draft, [field]: arr });
    },
    [draft, onChange]
  );

  const fields: Array<{ key: keyof Omit<StatedPreferences, 'notes'>; label: string }> = [
    { key: 'shapes', label: 'Shapes' },
    { key: 'materials', label: 'Materials' },
    { key: 'colours', label: 'Colours' },
    { key: 'avoid', label: 'Avoid' },
    { key: 'brandsAdmired', label: 'Brands admired' },
  ];

  return (
    <View>
      {fields.map(({ key, label }) => (
        <View key={key} className="mb-md">
          <Text className="text-bodyStrong text-text-primary mb-xs">{label}</Text>
          <View className="flex-row flex-wrap gap-xs">
            {draft[key].map((item, index) => (
              <View key={`${item}-${index}`} className="flex-row items-center bg-bg-page px-sm py-xs rounded-md">
                <Text className="text-caption text-text-primary mr-xs">{item}</Text>
                <Pressable
                  onPress={() => removeItem(key, index)}
                  className="min-w-[24px] min-h-[24px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item}`}
                >
                  <X color="#6B6B6B" size={14} />
                </Pressable>
              </View>
            ))}
            {newItemField === key ? (
              <View className="flex-row items-center">
                <TextInput
                  value={newItemValue}
                  onChangeText={setNewItemValue}
                  onSubmitEditing={() => addItem(key)}
                  autoFocus
                  placeholder={`Add ${label.toLowerCase()}`}
                  className="text-caption border border-border rounded-md px-sm py-xs w-32"
                  placeholderTextColor="#6B6B6B"
                />
                <Pressable
                  onPress={() => addItem(key)}
                  className="min-w-[32px] min-h-[32px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Confirm add ${label}`}
                >
                  <Plus color="#005D23" size={16} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => { setNewItemField(key); setNewItemValue(''); }}
                className="flex-row items-center bg-border/50 px-sm py-xs rounded-md min-h-[32px]"
                accessibilityRole="button"
                accessibilityLabel={`Add ${label}`}
              >
                <Plus color="#6B6B6B" size={14} />
                <Text className="text-caption text-text-muted ml-xs">Add</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}

      {/* Notes */}
      <View className="mb-md">
        <Text className="text-bodyStrong text-text-primary mb-xs">Notes</Text>
        <TextInput
          value={draft.notes}
          onChangeText={(text) => onChange({ ...draft, notes: text })}
          multiline
          numberOfLines={3}
          className="text-body text-text-primary border border-border rounded-md px-md py-sm min-h-[66px]"
          placeholder="Preference notes..."
          placeholderTextColor="#6B6B6B"
          textAlignVertical="top"
        />
      </View>

      {/* Actions */}
      <View className="flex-row justify-end gap-md">
        <Pressable
          onPress={onCancel}
          className="min-h-[44px] px-lg items-center justify-center border border-border rounded-md"
          accessibilityRole="button"
          accessibilityLabel="Cancel editing preferences"
        >
          <Text className="text-bodyStrong text-text-primary">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={saving}
          className={`min-h-[44px] px-lg items-center justify-center rounded-md ${saving ? 'bg-accent/40' : 'bg-accent'}`}
          accessibilityRole="button"
          accessibilityLabel="Save preferences"
        >
          <Text className="text-bodyStrong text-text-inverse">
            {saving ? 'Saving...' : 'Save Preferences'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react-native';
import { Sheet, TextField, Field, ChoiceChips, Button } from '@/src/ui/kit';
import { useClientPreferences, useUpdatePreferences } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';
import type { StatedPreferences } from '@/src/api/clients.types';

interface PreferencesSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

type ListKey = keyof Omit<StatedPreferences, 'notes'>;

const GROUPS: Array<{ key: ListKey; label: string; options: string[] }> = [
  { key: 'shapes', label: 'Shapes', options: ['Rectangular', 'Square', 'Round', 'Cat-eye', 'Aviator', 'Geometric'] },
  { key: 'colours', label: 'Colours', options: ['Tortoise', 'Black', 'Crystal', 'Bold colour', 'Metallic'] },
  { key: 'materials', label: 'Materials', options: ['Acetate', 'Titanium', 'Steel', 'Combination'] },
  { key: 'brandsAdmired', label: 'Brands they like', options: [] },
  { key: 'avoid', label: 'Avoid', options: ['Heavy frames', 'Thick rims', 'Bright colours', 'Oversized'] },
];

const EMPTY: StatedPreferences = { shapes: [], materials: [], colours: [], avoid: [], brandsAdmired: [], notes: '' };

function Group({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const all = [...new Set([...options, ...value])];
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
    setAdding(false);
  };
  return (
    <Field label={label}>
      <View className="flex-row flex-wrap items-center gap-[8px]">
        {all.length ? <ChoiceChips multiple options={all} value={value} onChange={onChange} /> : null}
        {adding ? null : <Button label="Add" icon={Plus} size="sm" variant="ghost" onPress={() => setAdding(true)} />}
      </View>
      {adding ? (
        <View className="flex-row items-end gap-[8px]">
          <TextField className="flex-1" label={`New ${label.toLowerCase()}`} value={draft} onChangeText={setDraft} onSubmitEditing={add} returnKeyType="done" autoFocus />
          <Button label="Add" onPress={add} disabled={!draft.trim()} />
        </View>
      ) : null}
    </Field>
  );
}

export function PreferencesSheet({ clientId, visible, onClose }: PreferencesSheetProps) {
  const { data: preferences, isLoading } = useClientPreferences(clientId);
  const updatePreferences = useUpdatePreferences();
  const [form, setForm] = useState<StatedPreferences>(EMPTY);

  useEffect(() => {
    if (preferences?.stated) setForm({ ...EMPTY, ...preferences.stated });
  }, [preferences]);

  const save = async () => {
    try {
      await updatePreferences.mutateAsync({ clientId, data: form });
      toast.success('Preferences saved');
      onClose();
    } catch {
      toast.error('Couldn’t save preferences', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Frame preferences"
      subtitle="What they gravitate to, and what to steer away from."
      primary={{ label: 'Save preferences', onPress: save, disabled: isLoading, loading: updatePreferences.isPending }}
    >
      <View className="gap-[24px]">
        {GROUPS.map((g) => (
          <Group key={g.key} label={g.label} options={g.options} value={form[g.key]} onChange={(v) => setForm((f) => ({ ...f, [g.key]: v }))} />
        ))}
        <TextField label="Notes" value={form.notes} onChangeText={(notes) => setForm((f) => ({ ...f, notes }))} placeholder="e.g. Loves the Marais in crimson, finds metal too cold" multiline />
        {isLoading ? <Text className="text-body-sm text-text-tertiary">Loading saved preferences…</Text> : null}
      </View>
    </Sheet>
  );
}

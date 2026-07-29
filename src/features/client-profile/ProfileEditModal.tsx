/**
 * ProfileEditModal — Unified modal for editing any profile section.
 *
 * Accepts field definitions and renders the appropriate input for each.
 * One component for: Contact, Fit Profile, Preferences, Insurance, Lifestyle, Notes.
 *
 * Field types: text, number, email, phone, select, chips (multi-select), textarea
 */
import { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Button } from '@/src/ui/Button';

// ─── Field Definition Types ──────────────────────────────────

export type FieldType = 'text' | 'number' | 'email' | 'phone' | 'select' | 'chips' | 'textarea';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  /** For select/chips: the available options */
  options?: string[];
  /** Is this an "avoid" field (inverted chip styling) */
  inverted?: boolean;
  /** Optional suffix shown after value (e.g. "mm") */
  suffix?: string;
  /** Required field */
  required?: boolean;
  /** Half-width (rendered in a 2-col row with the next half-width field) */
  half?: boolean;
}

interface ProfileEditModalProps {
  /** Modal title */
  title: string;
  /** Subtitle / context */
  subtitle?: string;
  /** Whether modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Field definitions */
  fields: FieldDef[];
  /** Initial values (key → value map) */
  initialValues: Record<string, string>;
  /** Save handler — receives the full form state */
  onSave: (values: Record<string, string>) => Promise<void> | void;
  /** Save button label (default: "Save") */
  saveLabel?: string;
  /** Whether save is in progress */
  saving?: boolean;
}

export function ProfileEditModal({
  title,
  subtitle,
  visible,
  onClose,
  fields,
  initialValues,
  onSave,
  saveLabel = 'Save',
  saving = false,
}: ProfileEditModalProps) {
  const [form, setForm] = useState<Record<string, string>>(initialValues);

  // Reset form when modal opens with new values
  useEffect(() => {
    if (visible) {
      setForm(initialValues);
    }
  }, [visible, initialValues]);

  const setValue = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleChip = (key: string, option: string) => {
    setForm(prev => {
      const current = prev[key] ? prev[key].split(',').filter(Boolean) : [];
      const updated = current.includes(option)
        ? current.filter(v => v !== option)
        : [...current, option];
      return { ...prev, [key]: updated.join(',') };
    });
  };

  const handleSave = async () => {
    // Check required fields
    const missing = fields.filter(f => f.required && !form[f.key]?.trim());
    if (missing.length > 0) {
      Alert.alert('Required', `${missing[0]!.label} is required.`);
      return;
    }
    try {
      await onSave(form);
      onClose();
    } catch {
      Alert.alert('Error', `Failed to save ${title.toLowerCase()}.`);
    }
  };

  if (!visible) return null;

  // Group fields into rows (half-width fields pair up)
  const rows: FieldDef[][] = [];
  let i = 0;
  while (i < fields.length) {
    const current = fields[i]!;
    if (current.half && i + 1 < fields.length && fields[i + 1]!.half) {
      rows.push([current, fields[i + 1]!]);
      i += 2;
    } else {
      rows.push([current]);
      i++;
    }
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View
          className="bg-bg-surface rounded-lg border border-border w-full max-w-[640px]"
          style={{ flex: 1, maxHeight: 720 }}
        >
          {/* Header */}
          <View className="px-lg py-md border-b border-border">
            <Text className="text-heading-lg text-text-primary font-semibold">{title}</Text>
            {subtitle && (
              <Text className="text-body-sm text-text-secondary mt-xs">{subtitle}</Text>
            )}
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-lg gap-md">
              {rows.map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  className={row.length > 1 ? 'flex-row gap-md' : ''}
                >
                  {row.map((field) => (
                    <View key={field.key} className={row.length > 1 ? 'flex-1' : ''}>
                      <FieldRenderer
                        field={field}
                        value={form[field.key] || ''}
                        onChange={(val: string) => setValue(field.key, val)}
                        onToggleChip={(option: string) => toggleChip(field.key, option)}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-lg py-md border-t border-border flex-row justify-end gap-md">
            <Button variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} loading={saving}>
              {saveLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Field Renderer ──────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
  onToggleChip,
}: {
  field: FieldDef;
  value: string;
  onChange: (val: string) => void;
  onToggleChip: (option: string) => void;
}) {
  const labelEl = (
    <Text className="text-body-sm text-text-secondary mb-xs font-medium">
      {field.label}{field.required ? ' *' : ''}{field.suffix ? ` (${field.suffix})` : ''}
    </Text>
  );

  switch (field.type) {
    case 'text':
    case 'number':
    case 'email':
    case 'phone':
      return (
        <View>
          {labelEl}
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="rgba(29,31,33,0.35)"
            keyboardType={
              field.type === 'number' ? 'numeric' :
              field.type === 'email' ? 'email-address' :
              field.type === 'phone' ? 'phone-pad' : 'default'
            }
            className="border border-border rounded-md px-md py-sm text-body-md text-text-primary bg-bg-page min-h-[44px]"
          />
        </View>
      );

    case 'textarea':
      return (
        <View>
          {labelEl}
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="rgba(29,31,33,0.35)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="border border-border rounded-md px-md py-sm text-body-md text-text-primary bg-bg-page min-h-[88px]"
          />
        </View>
      );

    case 'select':
      return (
        <View>
          {labelEl}
          <View className="flex-row flex-wrap gap-sm">
            {(field.options || []).map((option) => {
              const isSelected = value === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => onChange(isSelected ? '' : option)}
                  className={`px-md py-sm rounded-md border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-bg-inverse border-bg-inverse'
                      : 'bg-bg-page border-border'
                  }`}
                >
                  <Text className={`text-body-sm ${
                    isSelected ? 'text-text-inverse' : 'text-text-primary'
                  }`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    case 'chips':
      const selected = value ? value.split(',').filter(Boolean) : [];
      return (
        <View>
          {labelEl}
          <View className="flex-row flex-wrap gap-sm">
            {(field.options || []).map((option) => {
              const isSelected = selected.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => onToggleChip(option)}
                  className={`px-md py-sm rounded-md border min-h-[44px] justify-center ${
                    isSelected
                      ? field.inverted
                        ? 'bg-error/10 border-error'
                        : 'bg-bg-inverse border-bg-inverse'
                      : 'bg-bg-page border-border'
                  }`}
                >
                  <Text className={`text-body-sm ${
                    isSelected
                      ? field.inverted
                        ? 'text-error line-through'
                        : 'text-text-inverse'
                      : 'text-text-primary'
                  }`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );

    default:
      return null;
  }
}

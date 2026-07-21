/**
 * InsuranceFormSheet — bottom sheet for creating/editing insurance profiles.
 *
 * Fields: Provider, Policy Number, Coverage Amount, Pairs Allowed, Pairs Used, Renewal Date, Notes
 * API: POST /api/admin/multi-pair/insurance (create)
 *      PUT  /api/admin/multi-pair/insurance/{id} (update)
 */
import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useInsuranceProfile, useSaveInsurance, useUpdateInsurance } from '@/src/api/useMultiPair';
import { toast } from '@/src/ui/useToastStore';
import type { InsuranceProfile, SaveInsurancePayload, UpdateInsurancePayload } from '@/src/api/multi-pair.types';

interface InsuranceFormSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function InsuranceFormSheet({ clientId, visible, onClose }: InsuranceFormSheetProps) {
  const { data: existing } = useInsuranceProfile(clientId);
  const saveInsurance = useSaveInsurance();
  const updateInsurance = useUpdateInsurance();

  const [form, setForm] = useState({
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    pairsAllowed: '2',
    pairsUsed: '0',
    renewalDate: '',
    notes: '',
  });

  // Pre-fill form when existing data loads
  useEffect(() => {
    if (existing) {
      setForm({
        provider: existing.provider ?? '',
        policyNumber: existing.policyNumber ?? '',
        coverageAmount: existing.coverageAmount != null ? String(existing.coverageAmount) : '',
        pairsAllowed: String(existing.pairsAllowed ?? 2),
        pairsUsed: String(existing.pairsUsed ?? 0),
        renewalDate: existing.renewalDate ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [existing]);

  const isEditing = !!existing;

  const handleSave = useCallback(async () => {
    if (!form.provider.trim()) {
      toast.error('Provider required', 'Enter the insurance provider name');
      return;
    }

    const pairsAllowed = parseInt(form.pairsAllowed, 10);
    const pairsUsed = parseInt(form.pairsUsed, 10);
    const coverageAmount = form.coverageAmount ? parseFloat(form.coverageAmount) : undefined;

    if (isNaN(pairsAllowed) || pairsAllowed < 1) {
      toast.error('Invalid pairs', 'Pairs allowed must be at least 1');
      return;
    }

    try {
      if (isEditing && existing) {
        const payload: UpdateInsurancePayload = {
          provider: form.provider.trim(),
          policyNumber: form.policyNumber.trim() || undefined,
          coverageAmount,
          pairsAllowed,
          pairsUsed: isNaN(pairsUsed) ? 0 : pairsUsed,
          renewalDate: form.renewalDate.trim() || undefined,
          notes: form.notes.trim() || undefined,
        };
        await updateInsurance.mutateAsync({ id: existing.id, ...payload });
        toast.success('Insurance updated');
      } else {
        const payload: SaveInsurancePayload = {
          customerId: clientId,
          provider: form.provider.trim(),
          policyNumber: form.policyNumber.trim() || undefined,
          coverageAmount,
          pairsAllowed,
          pairsUsed: isNaN(pairsUsed) ? 0 : pairsUsed,
          renewalDate: form.renewalDate.trim() || undefined,
          notes: form.notes.trim() || undefined,
        };
        await saveInsurance.mutateAsync(payload);
        toast.success('Insurance saved');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save', 'Please try again');
    }
  }, [form, clientId, isEditing, existing, saveInsurance, updateInsurance, onClose]);

  const isPending = saveInsurance.isPending || updateInsurance.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-bg-page"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl pt-xl pb-md border-b border-border">
          <Text className="text-displayMd text-text-primary">
            {isEditing ? 'Edit Insurance' : 'Add Insurance'}
          </Text>
          <Pressable
            onPress={onClose}
            className="w-11 h-11 items-center justify-center rounded-full bg-bg-muted"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={20} color="#737373" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-xl py-lg" keyboardShouldPersistTaps="handled">
          <FormField
            label="Provider *"
            value={form.provider}
            onChangeText={(v) => setForm((f) => ({ ...f, provider: v }))}
            placeholder="e.g. Blue Cross, Sun Life"
            autoFocus
          />
          <FormField
            label="Policy Number"
            value={form.policyNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, policyNumber: v }))}
            placeholder="Optional"
          />
          <FormField
            label="Coverage Amount ($)"
            value={form.coverageAmount}
            onChangeText={(v) => setForm((f) => ({ ...f, coverageAmount: v }))}
            placeholder="e.g. 500"
            keyboardType="numeric"
          />

          <View className="flex-row gap-md">
            <View className="flex-1">
              <FormField
                label="Pairs Allowed"
                value={form.pairsAllowed}
                onChangeText={(v) => setForm((f) => ({ ...f, pairsAllowed: v }))}
                placeholder="2"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Pairs Used"
                value={form.pairsUsed}
                onChangeText={(v) => setForm((f) => ({ ...f, pairsUsed: v }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <FormField
            label="Renewal Date"
            value={form.renewalDate}
            onChangeText={(v) => setForm((f) => ({ ...f, renewalDate: v }))}
            placeholder="YYYY-MM-DD"
          />
          <FormField
            label="Notes"
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Any additional details..."
            multiline
          />

          {/* Pairs remaining indicator */}
          {parseInt(form.pairsAllowed, 10) > 0 && (
            <View className="bg-bg-muted rounded-lg p-md mt-md">
              <Text className="text-body text-text-primary">
                Pairs remaining: {Math.max(0, parseInt(form.pairsAllowed || '0', 10) - parseInt(form.pairsUsed || '0', 10))}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className="px-xl py-lg border-t border-border">
          <Pressable
            onPress={handleSave}
            disabled={isPending}
            className="bg-brand rounded-md py-md items-center min-h-[44px] justify-center"
            style={{ opacity: isPending ? 0.6 : 1 }}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Update insurance' : 'Save insurance'}
          >
            <Text className="text-brand-text text-bodyStrong">
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Save Insurance'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Form Field ──────────────────────────────────────────────

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View className="mb-md">
      <Text className="text-body text-text-secondary mb-xs">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A3A3A3"
        keyboardType={keyboardType}
        multiline={multiline}
        autoFocus={autoFocus}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`border border-border rounded-md px-md py-sm text-body text-text-primary bg-bg-elevated ${multiline ? 'min-h-[80px]' : 'min-h-[44px]'}`}
      />
    </View>
  );
}

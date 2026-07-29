import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, Alert, TextInput } from 'react-native'; import { Dimensions } from 'react-native';
import { Button } from '@/src/ui/Button';
import { useInsuranceProfile, useSaveInsurance } from '@/src/api/useMultiPair';

interface InsuranceFormSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  multiline?: boolean;
  numberOfLines?: number;
}

function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, numberOfLines = 1 }: InputProps) {
  return (
    <View className="gap-xs">
      <Text className="text-body-md text-text-primary font-medium">{label}</Text>
      <TextInput
        className="border border-border rounded-md px-md py-sm text-body-md text-text-primary bg-bg-surface min-h-[44px]"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#737373"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={multiline ? { minHeight: 44 * numberOfLines } : undefined}
      />
    </View>
  );
}

export function InsuranceFormSheet({ clientId, visible, onClose }: InsuranceFormSheetProps) {
  const { data: insurance } = useInsuranceProfile(clientId);
  const saveInsurance = useSaveInsurance();
  
  const [form, setForm] = useState({
    provider: '',
    policyNumber: '',
    coverageAmount: '',
    pairsAllowed: '2',
    pairsUsed: '0',
    renewalDate: '',
    notes: '',
  });

  useEffect(() => {
    if (insurance) {
      setForm({
        provider: insurance.provider || '',
        policyNumber: insurance.policyNumber || '',
        coverageAmount: insurance.coverageAmount?.toString() || '',
        pairsAllowed: insurance.pairsAllowed?.toString() || '2',
        pairsUsed: insurance.pairsUsed?.toString() || '0',
        renewalDate: insurance.renewalDate || '',
        notes: insurance.notes || '',
      });
    }
  }, [insurance]);

  const handleSubmit = async () => {
    if (!form.provider.trim()) {
      Alert.alert('Required Field', 'Insurance provider is required.');
      return;
    }

    try {
      await saveInsurance.mutateAsync({
        customerId: clientId,
        provider: form.provider,
        policyNumber: form.policyNumber,
        coverageAmount: form.coverageAmount ? parseFloat(form.coverageAmount) : undefined,
        pairsAllowed: parseInt(form.pairsAllowed),
        pairsUsed: parseInt(form.pairsUsed),
        renewalDate: form.renewalDate || undefined,
        notes: form.notes,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save insurance information');
    }
  };

  const pairsRemaining = parseInt(form.pairsAllowed) - parseInt(form.pairsUsed);
  const coverageRemaining = form.coverageAmount 
    ? parseFloat(form.coverageAmount) - (parseInt(form.pairsUsed) * 500) // Estimate $500 per pair
    : null;

  const renewalDays = form.renewalDate 
    ? Math.ceil((new Date(form.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center p-xl">
        <View className="bg-bg-surface rounded-lg border border-border w-full max-w-[640px]" style={{ flex: 1, maxHeight: 720 }}>
          {/* Header */}
          <View className="p-lg border-b border-border">
            <Text className="text-heading-lg text-text-primary font-medium">
              Insurance Information
            </Text>
            <Text className="text-body-md text-text-secondary mt-xs">
              Coverage details and benefits
            </Text>
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-lg gap-lg">
              <Input
                label="Insurance Provider *"
                value={form.provider}
                onChangeText={(text: string) => setForm(prev => ({ ...prev, provider: text }))}
                placeholder="e.g., Sun Life, Great-West Life"
              />

              <Input
                label="Policy Number"
                value={form.policyNumber}
                onChangeText={(text: string) => setForm(prev => ({ ...prev, policyNumber: text }))}
                placeholder="Policy or member number"
              />

              <View className="flex-row gap-md">
                <View className="flex-1">
                  <Input
                    label="Coverage Amount"
                    value={form.coverageAmount}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, coverageAmount: text }))}
                    placeholder="$500"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Pairs Allowed"
                    value={form.pairsAllowed}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, pairsAllowed: text }))}
                    placeholder="2"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row gap-md">
                <View className="flex-1">
                  <Input
                    label="Pairs Used"
                    value={form.pairsUsed}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, pairsUsed: text }))}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Renewal Date"
                    value={form.renewalDate}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, renewalDate: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <Input
                label="Notes"
                value={form.notes}
                onChangeText={(text: string) => setForm(prev => ({ ...prev, notes: text }))}
                placeholder="Additional coverage details"
                multiline
                numberOfLines={3}
              />

              {/* Coverage Summary */}
              <View className="bg-bg-muted rounded-lg p-md border border-border">
                <Text className="text-heading-sm text-text-primary font-medium mb-sm">
                  Coverage Summary
                </Text>
                <View className="gap-xs">
                  <View className="flex-row justify-between">
                    <Text className="text-body-md text-text-secondary">Pairs remaining</Text>
                    <Text className="text-body-md text-text-primary font-medium">
                      {pairsRemaining} of {form.pairsAllowed}
                    </Text>
                  </View>
                  {coverageRemaining !== null && (
                    <View className="flex-row justify-between">
                      <Text className="text-body-md text-text-secondary">Coverage remaining</Text>
                      <Text className="text-body-md text-text-primary font-medium">
                        ${coverageRemaining.toFixed(0)}
                      </Text>
                    </View>
                  )}
                  {renewalDays !== null && (
                    <View className="flex-row justify-between">
                      <Text className="text-body-md text-text-secondary">Days until renewal</Text>
                      <Text className={`text-body-md font-medium ${
                        renewalDays < 30 ? 'text-warning' : 'text-text-primary'
                      }`}>
                        {renewalDays} days
                      </Text>
                    </View>
                  )}
                </View>
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
              loading={saveInsurance.isPending}
            >
              Save Insurance
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
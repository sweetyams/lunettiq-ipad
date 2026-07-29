import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Sheet, FieldLabel, Chip, Button, Card, RowKV } from '@/src/ui';
import { useInsuranceProfile, useSaveInsurance } from '@/src/api/useMultiPair';
import type { SaveInsurancePayload } from '@/src/api/multi-pair.types';

interface InsuranceFormSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function InsuranceFormSheet({ clientId, visible, onClose }: InsuranceFormSheetProps) {
  const { data: existingProfile, isLoading } = useInsuranceProfile(clientId);
  const saveInsurance = useSaveInsurance();

  // Form state
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [coverageAmount, setCoverageAmount] = useState('');
  const [pairsAllowed, setPairsAllowed] = useState('');
  const [pairsUsed, setPairsUsed] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [notes, setNotes] = useState('');

  // Pre-fill form when existing profile loads
  useEffect(() => {
    if (existingProfile) {
      setProvider(existingProfile.provider || '');
      setPolicyNumber(existingProfile.policyNumber || '');
      setCoverageAmount(existingProfile.coverageAmount?.toString() || '');
      setPairsAllowed(existingProfile.pairsAllowed.toString());
      setPairsUsed(existingProfile.pairsUsed.toString());
      setRenewalDate(existingProfile.renewalDate || '');
      setNotes(existingProfile.notes || '');
    }
  }, [existingProfile]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!visible) {
      setProvider('');
      setPolicyNumber('');
      setCoverageAmount('');
      setPairsAllowed('');
      setPairsUsed('');
      setRenewalDate('');
      setNotes('');
    }
  }, [visible]);

  // Calculate live coverage summary
  const pairsAllowedNum = parseInt(pairsAllowed) || 0;
  const pairsUsedNum = parseInt(pairsUsed) || 0;
  const coverageAmountNum = parseFloat(coverageAmount) || 0;
  
  const pairsRemaining = Math.max(0, pairsAllowedNum - pairsUsedNum);
  const coveragePerPair = pairsAllowedNum > 0 ? coverageAmountNum / pairsAllowedNum : 0;
  const coverageRemaining = Math.max(0, coverageAmountNum - (coveragePerPair * pairsUsedNum));
  
  // Calculate days until renewal
  const daysUntilRenewal = renewalDate 
    ? Math.ceil((new Date(renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleSave = async () => {
    const payload: SaveInsurancePayload = {
      customerId: clientId,
      provider: provider.trim(),
      policyNumber: policyNumber.trim() || undefined,
      coverageAmount: coverageAmountNum || undefined,
      pairsAllowed: pairsAllowedNum,
      pairsUsed: pairsUsedNum || undefined,
      renewalDate: renewalDate.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      await saveInsurance.mutateAsync(payload);
      onClose();
    } catch (error) {
      // Error handling will be shown via mutation state
      console.error('Failed to save insurance:', error);
    }
  };

  const canSave = provider.trim() && pairsAllowedNum > 0;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Insurance Information"
      subtitle="Coverage details and household sharing"
      footer={
        <View className="flex-row gap-md">
          <Button variant="quiet" onPress={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onPress={handleSave}
            disabled={!canSave || saveInsurance.isPending}
            className="flex-1"
          >
            {saveInsurance.isPending ? 'Saving...' : 'Save insurance'}
          </Button>
        </View>
      }
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-lg">
          {/* Provider field */}
          <View>
            <FieldLabel>Provider</FieldLabel>
            <TextInput
              value={provider}
              onChangeText={setProvider}
              placeholder="e.g. Desjardins, Sun Life, Manulife"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
              placeholderTextColor="#737373"
            />
          </View>

          {/* Policy number + Coverage amount (2-col) */}
          <View className="flex-row gap-md">
            <View className="flex-1">
              <FieldLabel>Policy number</FieldLabel>
              <TextInput
                value={policyNumber}
                onChangeText={setPolicyNumber}
                placeholder="Optional"
                className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
                placeholderTextColor="#737373"
              />
            </View>
            <View className="flex-1">
              <FieldLabel>Coverage amount</FieldLabel>
              <TextInput
                value={coverageAmount}
                onChangeText={setCoverageAmount}
                placeholder="$0.00"
                keyboardType="numeric"
                className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
                placeholderTextColor="#737373"
              />
            </View>
          </View>

          {/* Pairs allowed + Pairs used + Renewal date (3-col) */}
          <View className="flex-row gap-sm">
            <View className="flex-1">
              <FieldLabel>Pairs allowed</FieldLabel>
              <TextInput
                value={pairsAllowed}
                onChangeText={setPairsAllowed}
                placeholder="2"
                keyboardType="numeric"
                className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
                placeholderTextColor="#737373"
              />
            </View>
            <View className="flex-1">
              <FieldLabel>Pairs used</FieldLabel>
              <TextInput
                value={pairsUsed}
                onChangeText={setPairsUsed}
                placeholder="0"
                keyboardType="numeric"
                className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
                placeholderTextColor="#737373"
              />
            </View>
            <View className="flex-1">
              <FieldLabel>Renewal date</FieldLabel>
              <TextInput
                value={renewalDate}
                onChangeText={setRenewalDate}
                placeholder="YYYY-MM-DD"
                className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary"
                placeholderTextColor="#737373"
              />
            </View>
          </View>

          {/* Shared with - household members */}
          <View>
            <FieldLabel>Shared with</FieldLabel>
            <View className="flex-row flex-wrap gap-sm">
              {/* TODO: When household members API is available, map over linked members */}
              {/* Example: spouse chip when linked */}
              <Chip label="Link household member" variant="add" />
            </View>
          </View>

          {/* Notes textarea */}
          <View>
            <FieldLabel>Notes</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Special conditions, restrictions, etc."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] py-[12px] text-body-md text-color-text-primary"
              placeholderTextColor="#737373"
            />
          </View>

          {/* Live coverage summary card */}
          {(pairsAllowedNum > 0 || coverageAmountNum > 0) && (
            <Card className="bg-color-bg-muted rounded-sm border-0">
              <Card.Body>
                <Text className="text-heading-sm text-color-text-primary mb-md">
                  Coverage Summary
                </Text>
                <View className="gap-sm">
                  <RowKV 
                    label="Pairs remaining" 
                    value={`${pairsRemaining} of ${pairsAllowedNum}`}
                  />
                  {coverageAmountNum > 0 && (
                    <RowKV 
                      label="Coverage remaining" 
                      value={`$${coverageRemaining.toFixed(2)}`}
                    />
                  )}
                  {daysUntilRenewal !== null && (
                    <RowKV 
                      label="Renews in" 
                      value={`${daysUntilRenewal} days`}
                    />
                  )}
                </View>
              </Card.Body>
            </Card>
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
}
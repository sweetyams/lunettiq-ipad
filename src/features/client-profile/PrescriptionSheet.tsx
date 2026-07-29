import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Sheet, FieldLabel, Chip, Button, Tag } from '@/src/ui';
import { useCreatePrescription } from '@/src/api/usePrescriptions';
import type { CreatePrescriptionPayload } from '@/src/api/prescriptions.types';

interface PrescriptionSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function PrescriptionSheet({ clientId, visible, onClose }: PrescriptionSheetProps) {
  const createPrescription = useCreatePrescription();

  // Form state
  const [source, setSource] = useState<'manual' | 'photo' | 'import'>('manual');
  const [type, setType] = useState<CreatePrescriptionPayload['type']>('single_vision');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [prescribedAt, setPrescribedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  
  // OD values (right eye)
  const [sphereOd, setSphereOd] = useState('');
  const [cylinderOd, setCylinderOd] = useState('');
  const [axisOd, setAxisOd] = useState('');
  const [addOd, setAddOd] = useState('');
  
  // OS values (left eye)
  const [sphereOs, setSphereOs] = useState('');
  const [cylinderOs, setCylinderOs] = useState('');
  const [axisOs, setAxisOs] = useState('');
  const [addOs, setAddOs] = useState('');
  
  // PD values
  const [pdBinocular, setPdBinocular] = useState('');
  const [pdRight, setPdRight] = useState('');
  const [pdLeft, setPdLeft] = useState('');
  const [segHeight, setSegHeight] = useState('');
  
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    try {
      const payload: CreatePrescriptionPayload = {
        clientId,
        type,
        prescribedBy: prescribedBy || undefined,
        prescribedAt: prescribedAt || undefined,
        expiresAt: expiresAt || undefined,
        notes: notes || undefined,
      };

      // Add numeric values only if they exist
      if (sphereOd) payload.sphereOd = parseFloat(sphereOd);
      if (cylinderOd) payload.cylinderOd = parseFloat(cylinderOd);
      if (axisOd) payload.axisOd = parseInt(axisOd);
      if (addOd) payload.addOd = parseFloat(addOd);
      if (sphereOs) payload.sphereOs = parseFloat(sphereOs);
      if (cylinderOs) payload.cylinderOs = parseFloat(cylinderOs);
      if (axisOs) payload.axisOs = parseInt(axisOs);
      if (addOs) payload.addOs = parseFloat(addOs);
      if (pdRight) payload.pdRight = parseFloat(pdRight);
      if (pdLeft) payload.pdLeft = parseFloat(pdLeft);

      await createPrescription.mutateAsync(payload);
      onClose();
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Failed to create prescription:', error);
    }
  };

  const footer = (
    <View className="flex-row justify-end gap-md">
      <Button variant="quiet" onPress={onClose}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onPress={handleSave}
        disabled={createPrescription.isPending}
      >
        {createPrescription.isPending ? 'Saving...' : 'Save prescription'}
      </Button>
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add Prescription"
      subtitle="Enter prescription values"
      footer={footer}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-lg">
          {/* Source selector */}
          <View className="gap-sm">
            <FieldLabel>Source</FieldLabel>
            <View className="flex-row gap-sm">
              <Chip
                label="Enter manually"
                variant={source === 'manual' ? 'on' : 'default'}
                onPress={() => setSource('manual')}
                />
              <Chip
                label="Photograph paper Rx"
                variant={source === 'photo' ? 'on' : 'default'}
                onPress={() => setSource('photo')}
                />
              <Chip
                label="Import from order"
                variant={source === 'import' ? 'on' : 'default'}
                onPress={() => setSource('import')}
                />
            </View>
          </View>

          {/* Type + Prescriber fields */}
          <View className="flex-row gap-md">
            <View className="flex-1 gap-sm">
              <FieldLabel>Type</FieldLabel>
              <View className="flex-row flex-wrap gap-xs">
                {(['single_vision', 'progressive', 'bifocal', 'reading', 'other'] as const).map((t) => (
                  <Chip
                    key={t}
                    label={t.replace('_', ' ')}
                    variant={type === t ? 'on' : 'default'}
                    onPress={() => setType(t)}
                  />

                ))}
              </View>
            </View>
            <View className="flex-1 gap-sm">
              <FieldLabel>Prescribed by</FieldLabel>
              <TextInput
                value={prescribedBy}
                onChangeText={setPrescribedBy}
                placeholder="Dr. Smith"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary"
              />
            </View>
          </View>

          {/* Exam date + Expiry fields */}
          <View className="flex-row gap-md">
            <View className="flex-1 gap-sm">
              <FieldLabel>Exam date</FieldLabel>
              <TextInput
                value={prescribedAt}
                onChangeText={setPrescribedAt}
                placeholder="2024-01-15"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
              />
            </View>
            <View className="flex-1 gap-sm">
              <FieldLabel>Expiry date</FieldLabel>
              <TextInput
                value={expiresAt}
                onChangeText={setExpiresAt}
                placeholder="2026-01-15"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
              />
            </View>
          </View>

          {/* Values table */}
          <View className="gap-sm">
            <FieldLabel>Values</FieldLabel>
            <View className="bg-bg-surface border border-border rounded-sm">
              {/* Header */}
              <View className="flex-row border-b border-border">
                <View className="w-16 p-sm border-r border-border">
                  <Text className="text-caption-md text-text-secondary font-medium">Eye</Text>
                </View>
                <View className="flex-1 p-sm border-r border-border">
                  <Text className="text-caption-md text-text-secondary font-medium">SPH</Text>
                </View>
                <View className="flex-1 p-sm border-r border-border">
                  <Text className="text-caption-md text-text-secondary font-medium">CYL</Text>
                </View>
                <View className="flex-1 p-sm border-r border-border">
                  <Text className="text-caption-md text-text-secondary font-medium">Axis</Text>
                </View>
                <View className="flex-1 p-sm">
                  <Text className="text-caption-md text-text-secondary font-medium">Add</Text>
                </View>
              </View>
              
              {/* OD row */}
              <View className="flex-row border-b border-border">
                <View className="w-16 p-sm border-r border-border items-center justify-center">
                  <Text className="text-body-md text-text-primary font-medium">OD</Text>
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={sphereOd}
                    onChangeText={setSphereOd}
                    placeholder="±0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={cylinderOd}
                    onChangeText={setCylinderOd}
                    placeholder="±0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={axisOd}
                    onChangeText={setAxisOd}
                    placeholder="180"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={addOd}
                    onChangeText={setAddOd}
                    placeholder="+0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
              </View>
              
              {/* OS row */}
              <View className="flex-row">
                <View className="w-16 p-sm border-r border-border items-center justify-center">
                  <Text className="text-body-md text-text-primary font-medium">OS</Text>
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={sphereOs}
                    onChangeText={setSphereOs}
                    placeholder="±0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={cylinderOs}
                    onChangeText={setCylinderOs}
                    placeholder="±0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1 border-r border-border">
                  <TextInput
                    value={axisOs}
                    onChangeText={setAxisOs}
                    placeholder="180"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={addOs}
                    onChangeText={setAddOs}
                    placeholder="+0.00"
                    keyboardType="numeric"
                    className="px-sm py-sm text-body-md text-text-primary font-mono"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* PD fields */}
          <View className="flex-row gap-md">
            <View className="flex-1 gap-sm">
              <FieldLabel>PD binocular</FieldLabel>
              <TextInput
                value={pdBinocular}
                onChangeText={setPdBinocular}
                placeholder="62"
                keyboardType="numeric"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
              />
            </View>
            <View className="flex-1 gap-sm">
              <FieldLabel>PD OD/OS</FieldLabel>
              <View className="flex-row gap-xs">
                <TextInput
                  value={pdRight}
                  onChangeText={setPdRight}
                  placeholder="31"
                  keyboardType="numeric"
                  className="flex-1 border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
                />
                <TextInput
                  value={pdLeft}
                  onChangeText={setPdLeft}
                  placeholder="31"
                  keyboardType="numeric"
                  className="flex-1 border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
                />
              </View>
            </View>
            <View className="flex-1 gap-sm">
              <FieldLabel>Seg height</FieldLabel>
              <TextInput
                value={segHeight}
                onChangeText={setSegHeight}
                placeholder="14"
                keyboardType="numeric"
                className="border border-border rounded-sm bg-bg-surface px-[12px] min-h-[44px] text-body-md text-text-primary font-mono"
              />
            </View>
          </View>

          {/* Photo upload area */}
          <View className="gap-sm">
            <FieldLabel>Photo</FieldLabel>
            <View className="border-2 border-dashed border-border rounded-md p-xl items-center justify-center min-h-[120px] bg-bg-muted">
              <Text className="text-text-secondary text-body-sm">
                Tap to upload prescription photo
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View className="gap-sm">
            <FieldLabel>Notes</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="border border-border rounded-sm bg-bg-surface px-[12px] py-[12px] text-body-md text-text-primary"
            />
          </View>

          {/* Unverified explanation */}
          <View className="gap-sm">
            <View className="flex-row items-center gap-sm">
              <Tag label="Unverified" variant="warn" />
              <Text className="text-text-secondary text-body-sm flex-1">
                This prescription will be marked as unverified until reviewed by an optometrist
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Sheet>
  );
}
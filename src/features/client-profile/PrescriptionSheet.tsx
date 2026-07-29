import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, Pressable, TextInput, Alert } from 'react-native'; import { Dimensions } from 'react-native';
import { Button } from '@/src/ui/Button';
import { useCreatePrescription } from '@/src/api/usePrescriptions';
import type { CreatePrescriptionPayload } from '@/src/api/prescriptions.types';
import { Camera, FileText, Download, Info } from 'lucide-react-native';

interface PrescriptionSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

interface SourceSelectorProps {
  selected: string;
  onSelect: (source: string) => void;
}

function SourceSelector({ selected, onSelect }: SourceSelectorProps) {
  const sources = [
    { key: 'manual', label: 'Enter manually', icon: FileText },
    { key: 'photo', label: 'Photograph', icon: Camera },
    { key: 'import', label: 'Import', icon: Download },
  ];

  return (
    <View>
      <Text className="text-heading-sm text-text-primary font-medium mb-md">
        Prescription Source
      </Text>
      <View className="flex-row gap-md">
        {sources.map(({ key, label, icon: Icon }) => (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            className={`flex-1 flex-row items-center justify-center px-md py-md rounded-md border min-h-[44px] ${
              selected === key
                ? 'bg-bg-inverse border-bg-inverse'
                : 'bg-bg-surface border-border'
            }`}
          >
            <Icon 
              size={16} 
              className={selected === key ? 'text-text-inverse' : 'text-text-secondary'} 
            />
            <Text className={`text-body-md ml-xs ${
              selected === key ? 'text-text-inverse' : 'text-text-primary'
            }`}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function PrescriptionSheet({ clientId, visible, onClose }: PrescriptionSheetProps) {
  const createPrescription = useCreatePrescription();
  
  const [source, setSource] = useState('manual');
  const [form, setForm] = useState({
    type: 'distance', // distance, reading, bifocal, progressive
    prescriber: '',
    examDate: '',
    expiryDate: '',
    // OD (right eye)
    odSph: '',
    odCyl: '',
    odAxis: '',
    odAdd: '',
    // OS (left eye)
    osSph: '',
    osCyl: '',
    osAxis: '',
    osAdd: '',
    // PD
    pdBinocular: '',
    pdMonocularOd: '',
    pdMonocularOs: '',
    segHeight: '',
    notes: '',
  });

  const prescriptionTypes = [
    { key: 'distance', label: 'Distance' },
    { key: 'reading', label: 'Reading' },
    { key: 'bifocal', label: 'Bifocal' },
    { key: 'progressive', label: 'Progressive' },
  ];

  const handleSubmit = async () => {
    if (!form.prescriber.trim()) {
      Alert.alert('Required Field', 'Prescriber is required.');
      return;
    }

    try {
      await createPrescription.mutateAsync({
        clientId,
        type: form.type as CreatePrescriptionPayload['type'],
        prescribedBy: form.prescriber || undefined,
        prescribedAt: form.examDate || undefined,
        expiresAt: form.expiryDate || undefined,
        sphereOd: form.odSph ? parseFloat(form.odSph) : undefined,
        cylinderOd: form.odCyl ? parseFloat(form.odCyl) : undefined,
        axisOd: form.odAxis ? parseInt(form.odAxis) : undefined,
        addOd: form.odAdd ? parseFloat(form.odAdd) : undefined,
        sphereOs: form.osSph ? parseFloat(form.osSph) : undefined,
        cylinderOs: form.osCyl ? parseFloat(form.osCyl) : undefined,
        axisOs: form.osAxis ? parseInt(form.osAxis) : undefined,
        addOs: form.osAdd ? parseFloat(form.osAdd) : undefined,
        pdRight: form.pdMonocularOd ? parseFloat(form.pdMonocularOd) : (form.pdBinocular ? parseFloat(form.pdBinocular) / 2 : undefined),
        pdLeft: form.pdMonocularOs ? parseFloat(form.pdMonocularOs) : (form.pdBinocular ? parseFloat(form.pdBinocular) / 2 : undefined),
        notes: form.notes || undefined,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save prescription');
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
              New Prescription
            </Text>
            <Text className="text-body-md text-text-secondary mt-xs">
              Add prescription record
            </Text>
          </View>

          {/* Body */}
          <ScrollView style={{ flexGrow: 1, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-lg gap-lg">
              <SourceSelector selected={source} onSelect={setSource} />

              {/* Type Selection */}
              <View>
                <Text className="text-heading-sm text-text-primary font-medium mb-md">
                  Prescription Type
                </Text>
                <View className="flex-row flex-wrap gap-sm">
                  {prescriptionTypes.map(({ key, label }) => (
                    <Pressable
                      key={key}
                      onPress={() => setForm(prev => ({ ...prev, type: key }))}
                      className={`px-md py-sm rounded-md border min-h-[44px] justify-center ${
                        form.type === key
                          ? 'bg-bg-inverse border-bg-inverse'
                          : 'bg-bg-surface border-border'
                      }`}
                    >
                      <Text className={`text-body-md ${
                        form.type === key ? 'text-text-inverse' : 'text-text-primary'
                      }`}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Basic Info */}
              <View className="flex-row gap-md">
                <View className="flex-1">
                  <TextInput
                    value={form.prescriber}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, prescriber: text }))}
                    placeholder="Dr. Smith"
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    value={form.examDate}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, examDate: text }))}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <TextInput
                value={form.expiryDate}
                onChangeText={(text: string) => setForm(prev => ({ ...prev, expiryDate: text }))}
                placeholder="YYYY-MM-DD"
              />

              {/* OD/OS Values Table */}
              <View>
                <Text className="text-heading-sm text-text-primary font-medium mb-md">
                  Prescription Values
                </Text>
                
                {/* Table Header */}
                <View className="flex-row border-b border-border pb-sm mb-sm">
                  <Text className="flex-1 text-body-sm text-text-secondary font-mono">Eye</Text>
                  <Text className="flex-1 text-body-sm text-text-secondary font-mono text-center">SPH</Text>
                  <Text className="flex-1 text-body-sm text-text-secondary font-mono text-center">CYL</Text>
                  <Text className="flex-1 text-body-sm text-text-secondary font-mono text-center">AXIS</Text>
                  <Text className="flex-1 text-body-sm text-text-secondary font-mono text-center">ADD</Text>
                </View>

                {/* OD Row */}
                <View className="flex-row items-center mb-sm">
                  <Text className="flex-1 text-body-md text-text-primary font-mono">OD</Text>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.odSph}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, odSph: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.odCyl}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, odCyl: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.odAxis}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, odAxis: text }))}
                      placeholder="90"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.odAdd}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, odAdd: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                </View>

                {/* OS Row */}
                <View className="flex-row items-center">
                  <Text className="flex-1 text-body-md text-text-primary font-mono">OS</Text>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.osSph}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, osSph: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.osCyl}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, osCyl: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.osAxis}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, osAxis: text }))}
                      placeholder="90"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                  <View className="flex-1 px-xs">
                    <TextInput
                      value={form.osAdd}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, osAdd: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      className="text-center font-mono"
                    />
                  </View>
                </View>
              </View>

              {/* PD Section */}
              <View>
                <Text className="text-heading-sm text-text-primary font-medium mb-md">
                  Pupillary Distance
                </Text>
                <View className="flex-row gap-md">
                  <View className="flex-1">
                    <TextInput
                      value={form.pdBinocular}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, pdBinocular: text }))}
                      placeholder="64"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      value={form.pdMonocularOd}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, pdMonocularOd: text }))}
                      placeholder="32"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <TextInput
                      value={form.pdMonocularOs}
                      onChangeText={(text: string) => setForm(prev => ({ ...prev, pdMonocularOs: text }))}
                      placeholder="32"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View className="mt-md">
                  <TextInput
                    value={form.segHeight}
                    onChangeText={(text: string) => setForm(prev => ({ ...prev, segHeight: text }))}
                    placeholder="18"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {source === 'photo' && (
                <View className="bg-bg-muted rounded-lg p-md border border-border">
                  <Text className="text-body-md text-text-secondary text-center">
                    Photo attachment placeholder
                  </Text>
                </View>
              )}

              <TextInput
                value={form.notes}
                onChangeText={(text: string) => setForm(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes"
                multiline
                numberOfLines={3}
              />

              {/* Verification Notice */}
              <View className="bg-bg-muted rounded-lg p-md border border-border flex-row">
                <Info size={16} color="#737373" />
                <Text className="flex-1 text-body-sm text-text-secondary">
                  This prescription requires verification by a licensed optometrist before use.
                </Text>
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
              loading={createPrescription.isPending}
            >
              Save Prescription
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
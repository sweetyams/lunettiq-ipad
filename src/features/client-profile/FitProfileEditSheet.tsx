import { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Sheet, FieldLabel, Chip, Button } from '@/src/ui';
import { useClientEnrichment, useUpdateEnrichment } from '@/src/api/useClients';

interface FitProfileEditSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

export function FitProfileEditSheet({ clientId, visible, onClose }: FitProfileEditSheetProps) {
  const { data: enrichment, isLoading } = useClientEnrichment(clientId);
  const updateEnrichment = useUpdateEnrichment();

  const [faceShape, setFaceShape] = useState<string>('');
  const [frameWidth, setFrameWidth] = useState('');
  const [bridgeWidth, setBridgeWidth] = useState('');
  const [templeLength, setTempleLength] = useState('');
  const [ipd, setIpd] = useState('');

  const faceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Oblong', 'Diamond'];

  // Pre-fill form when enrichment data loads
  useEffect(() => {
    if (enrichment) {
      setFaceShape(enrichment.faceShape || '');
      setFrameWidth(enrichment.frameWidthMm ? enrichment.frameWidthMm.toString() : '');
      setBridgeWidth(enrichment.bridgeWidthMm ? enrichment.bridgeWidthMm.toString() : '');
      // Temple length and IPD don't exist in API yet - keep as empty for now
      setTempleLength('');
      setIpd('');
    }
  }, [enrichment]);

  const handleSave = async () => {
    try {
      await updateEnrichment.mutateAsync({
        clientId,
        data: {
          faceShape: faceShape || null,
          frameWidthMm: frameWidth.trim() ? Number(frameWidth) : null,
          bridgeWidthMm: bridgeWidth.trim() ? Number(bridgeWidth) : null,
          // Note: Temple length and IPD not saved yet (API gap documented)
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to update fit profile:', error);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (enrichment) {
      setFaceShape(enrichment.faceShape || '');
      setFrameWidth(enrichment.frameWidthMm ? enrichment.frameWidthMm.toString() : '');
      setBridgeWidth(enrichment.bridgeWidthMm ? enrichment.bridgeWidthMm.toString() : '');
    }
    setTempleLength('');
    setIpd('');
    onClose();
  };

  const footer = (
    <View className="flex-row gap-md">
      <Button variant="quiet" onPress={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onPress={handleSave} disabled={updateEnrichment.isPending || isLoading}>
        {updateEnrichment.isPending ? 'Saving...' : 'Save fit profile'}
      </Button>
    </View>
  );

  return (
    <Sheet
      visible={visible}
      onClose={handleCancel}
      title="Fit profile"
      footer={footer}
    >
      <View className="gap-lg">
        {/* Face shape */}
        <View>
          <FieldLabel>Face shape</FieldLabel>
          <View className="flex-row flex-wrap gap-sm">
            {faceShapes.map((shape) => (
              <Chip
                key={shape}
                label={shape}
                variant={faceShape === shape ? 'on' : 'default'}
                onPress={() => setFaceShape(shape)}
              />
            ))}
          </View>
        </View>

        {/* Frame width + Bridge width */}
        <View className="flex-row gap-md">
          <View className="flex-1">
            <FieldLabel>Frame width (mm)</FieldLabel>
            <TextInput
              value={frameWidth}
              onChangeText={setFrameWidth}
              placeholder="140"
              keyboardType="numeric"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary font-mono"
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Bridge width (mm)</FieldLabel>
            <TextInput
              value={bridgeWidth}
              onChangeText={setBridgeWidth}
              placeholder="18"
              keyboardType="numeric"
              className="border border-color-border rounded-sm bg-color-bg-surface px-[12px] min-h-[44px] text-body-md text-color-text-primary font-mono"
            />
          </View>
        </View>

        {/* Temple length + IPD (not saved yet) */}
        <View className="flex-row gap-md">
          <View className="flex-1">
            <FieldLabel>Temple length (mm)</FieldLabel>
            <TextInput
              value={templeLength}
              onChangeText={setTempleLength}
              placeholder="145"
              keyboardType="numeric"
              editable={false}
              className="border border-color-border rounded-sm bg-color-bg-muted px-[12px] min-h-[44px] text-body-md text-color-text-secondary font-mono"
            />
          </View>
          <View className="flex-1">
            <FieldLabel>IPD (mm)</FieldLabel>
            <TextInput
              value={ipd}
              onChangeText={setIpd}
              placeholder="64"
              keyboardType="numeric"
              editable={false}
              className="border border-color-border rounded-sm bg-color-bg-muted px-[12px] min-h-[44px] text-body-md text-color-text-secondary font-mono"
            />
          </View>
        </View>

        {/* Source info */}
        <View className="bg-color-bg-muted p-md rounded-sm">
          <Text className="text-body-sm text-color-text-secondary">
            Measurements from Second Sight or manual entry. Temple length and IPD coming soon.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
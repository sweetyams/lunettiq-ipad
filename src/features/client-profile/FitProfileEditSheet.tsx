import { View } from 'react-native';
import { useState, useEffect } from 'react';
import { Sheet, TextField, Field, ChoiceChips } from '@/src/ui/kit';
import { useClientEnrichment, useUpdateEnrichment } from '@/src/api/useClients';
import { toast } from '@/src/ui/useToastStore';

interface FitProfileEditSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

const FACE_SHAPES = ['Oval', 'Round', 'Square', 'Heart', 'Oblong', 'Diamond'] as const;

function mm(v: string, min: number, max: number): string | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? null : `Expected ${min}–${max} mm.`;
}

export function FitProfileEditSheet({ clientId, visible, onClose }: FitProfileEditSheetProps) {
  const { data: enrichment, isLoading } = useClientEnrichment(clientId);
  const updateEnrichment = useUpdateEnrichment();
  const [faceShape, setFaceShape] = useState<string | null>(null);
  const [lens, setLens] = useState('');
  const [bridge, setBridge] = useState('');

  useEffect(() => {
    if (!enrichment) return;
    setFaceShape(enrichment.faceShape || null);
    setLens(enrichment.frameWidthMm ? String(enrichment.frameWidthMm) : '');
    setBridge(enrichment.bridgeWidthMm ? String(enrichment.bridgeWidthMm) : '');
  }, [enrichment]);

  const lensError = mm(lens, 38, 62);
  const bridgeError = mm(bridge, 12, 26);

  const save = async () => {
    try {
      await updateEnrichment.mutateAsync({
        clientId,
        data: {
          faceShape: faceShape || null,
          frameWidthMm: lens.trim() ? Number(lens) : null,
          bridgeWidthMm: bridge.trim() ? Number(bridge) : null,
        },
      });
      toast.success('Fit saved');
      onClose();
    } catch {
      toast.error('Couldn’t save fit', 'Check the connection and try again.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Fit"
      subtitle="From a frame that fits them well: the numbers printed inside the temple."
      primary={{ label: 'Save fit', onPress: save, disabled: isLoading || !!(lensError || bridgeError), loading: updateEnrichment.isPending }}
    >
      <View className="gap-[20px]">
        <Field label="Face shape">
          <ChoiceChips options={FACE_SHAPES} value={faceShape as (typeof FACE_SHAPES)[number] | null} onChange={setFaceShape} />
        </Field>
        <View className="flex-row gap-[16px]">
          <TextField className="flex-1" label="Lens width (mm)" hint="First number, e.g. 52 in 52□18." value={lens} onChangeText={setLens} error={lensError} placeholder="52" keyboardType="number-pad" />
          <TextField className="flex-1" label="Bridge (mm)" hint="Second number, e.g. 18." value={bridge} onChangeText={setBridge} error={bridgeError} placeholder="18" keyboardType="number-pad" />
        </View>
      </View>
    </Sheet>
  );
}

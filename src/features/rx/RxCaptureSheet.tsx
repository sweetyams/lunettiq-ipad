/**
 * Prescription from a photo (gap checklist: Orders "upload or take photo", intake
 * "photograph a prescription"). Take or pick a photo → Foundry reads it (AI) →
 * staff check every value → saved with `/api/rx/capture`, which attaches it to the
 * client's orders waiting for a prescription. Manual entry works without a photo.
 */
import { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageUp, Sparkles } from 'lucide-react-native';
import { Badge, Button, Field, Sheet, TextField, kitColors } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import { scanRxPhoto, useCaptureRx, type RxScanResult } from '@/src/api/useOrderDetail';

interface Props {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  /** Order waiting for this prescription (moves it on once attached). */
  rxOrderId?: string;
  onSaved?: (scan: RxScanResult | null) => void;
}

type Eye = 'od' | 'os';
type Col = 'sphere' | 'cylinder' | 'axis' | 'add';
const COLS: Col[] = ['sphere', 'cylinder', 'axis', 'add'];
const COL_LABEL: Record<Col, { en: string; fr: string }> = {
  sphere: { en: 'SPH', fr: 'SPH' }, cylinder: { en: 'CYL', fr: 'CYL' }, axis: { en: 'AXIS', fr: 'AXE' }, add: { en: 'ADD', fr: 'ADD' },
};

const str = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '' : String(n));
const num = (s: string) => {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function rxGridError(col: Col, value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const n = num(v);
  if (n == null) return true;
  if (col === 'axis') return n < 0 || n > 180 || !Number.isInteger(n);
  if (col === 'add') return n < 0 || n > 4;
  if (col === 'cylinder') return Math.abs(n) > 10;
  return Math.abs(n) > 25;
}

export function RxCaptureSheet({ visible, onClose, customerId, rxOrderId, onSaved }: Props) {
  const fr = useLangStore((s) => s.uiLang) === 'fr';
  const capture = useCaptureRx();
  const [photo, setPhoto] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<RxScanResult | null>(null);
  const [grid, setGrid] = useState<Record<`${Eye}.${Col}`, string>>({} as Record<`${Eye}.${Col}`, string>);
  const [pdR, setPdR] = useState('');
  const [pdL, setPdL] = useState('');
  const [pd, setPd] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [date, setDate] = useState('');

  const pick = async (from: 'camera' | 'library') => {
    try {
      const perm = from === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.warning(fr ? 'Accès refusé' : 'Access denied', fr ? 'Autorisez l’appareil photo dans Réglages.' : 'Allow camera access in Settings.');
        return;
      }
      const res = from === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ['images'] });
      const uri = res.canceled ? null : res.assets?.[0]?.uri ?? null;
      if (!uri) return;
      setPhoto(uri);
      setScanning(true);
      try {
        const r = await scanRxPhoto(uri);
        setScan(r);
        const next = {} as Record<`${Eye}.${Col}`, string>;
        for (const eye of ['od', 'os'] as Eye[]) for (const c of COLS) next[`${eye}.${c}`] = str(r[eye]?.[c]);
        setGrid(next);
        setPdR(str(r.pdRight)); setPdL(str(r.pdLeft)); setPd(str(r.pd));
        setPrescriber([r.prescriberName, r.prescriberClinic].filter(Boolean).join(', '));
        setDate(r.prescriptionDate ?? '');
      } catch {
        toast.info(fr ? 'Lecture impossible' : 'Couldn’t read it', fr ? 'Entrez les valeurs à la main; la photo est gardée.' : 'Type the values in; the photo is kept.');
      } finally {
        setScanning(false);
      }
    } catch {
      toast.error(fr ? 'Photo non prise' : 'No photo taken');
    }
  };

  const hasErrors = (['od', 'os'] as Eye[]).some((e) => COLS.some((c) => rxGridError(c, grid[`${e}.${c}`] ?? '')));
  const hasValues = Object.values(grid).some((v) => v.trim());

  const save = async () => {
    const eye = (e: Eye) => ({ sphere: num(grid[`${e}.sphere`] ?? ''), cylinder: num(grid[`${e}.cylinder`] ?? ''), axis: num(grid[`${e}.axis`] ?? ''), add: num(grid[`${e}.add`] ?? '') });
    const [name, ...clinic] = prescriber.split(',');
    try {
      await capture.mutateAsync({
        customerId, rxOrderId,
        od: eye('od'), os: eye('os'),
        pd: { single: num(pd), right: num(pdR), left: num(pdL) },
        prescriber: { name: name?.trim() || null, clinic: clinic.join(',').trim() || null, date: date.trim() || null },
        source: scan ? 'ocr' : 'manual',
        confidence: scan?.confidence ?? null,
      });
      toast.success(fr ? 'Ordonnance enregistrée' : 'Prescription saved', rxOrderId ? (fr ? 'Jointe à la commande.' : 'Attached to the order.') : undefined);
      onSaved?.(scan);
      onClose();
    } catch (e) {
      toast.error(fr ? 'Ordonnance non enregistrée' : 'Couldn’t save the prescription', e instanceof Error ? e.message : undefined);
    }
  };

  const cell = (e: Eye, c: Col) => {
    const k = `${e}.${c}` as const;
    const bad = rxGridError(c, grid[k] ?? '');
    return (
      <TextInput
        key={k}
        value={grid[k] ?? ''}
        onChangeText={(v) => setGrid((g) => ({ ...g, [k]: v }))}
        keyboardType="numbers-and-punctuation"
        accessibilityLabel={`${e.toUpperCase()} ${COL_LABEL[c].en}`}
        className={`flex-1 bg-bg-page border rounded-md px-[10px] min-h-[44px] text-body-md text-text-primary text-center ${bad ? 'border-error' : 'border-border'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      />
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={fr ? 'Ordonnance' : 'Prescription'}
      subtitle={fr ? 'Photographiez-la ou importez-la. Vérifiez chaque valeur avant d’enregistrer.' : 'Take a photo or upload one. Check every value before saving.'}
      secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{ label: fr ? 'Enregistrer' : 'Save prescription', onPress: save, disabled: !hasValues || hasErrors || scanning, loading: capture.isPending }}
    >
      <View className="gap-[20px]">
        <View className="flex-row items-center gap-[12px]">
          <Button label={fr ? 'Prendre une photo' : 'Take a photo'} icon={Camera} variant={photo ? 'secondary' : 'primary'} onPress={() => pick('camera')} />
          <Button label={fr ? 'Importer' : 'Upload'} icon={ImageUp} onPress={() => pick('library')} />
          {photo ? <Image source={{ uri: photo }} style={{ width: 64, height: 44, borderRadius: 6 }} contentFit="cover" /> : null}
          {scanning ? <ActivityIndicator color={kitColors.iconMuted} /> : null}
          {scan && !scanning ? <Badge tone="info" dot>{fr ? 'Lu par l’IA, à vérifier' : 'Read by AI, check it'}</Badge> : null}
        </View>
        {scan?.patientName ? <Text className="text-body-md text-text-secondary">{`${fr ? 'Nom sur l’ordonnance' : 'Name on the prescription'}: ${scan.patientName}`}</Text> : null}
        {scan?.warnings?.length ? (
          <View className="flex-row items-start gap-[8px]">
            <Sparkles size={16} color={kitColors.iconMuted} />
            <Text className="flex-1 text-body-sm text-warning">{scan.warnings.join(' · ')}</Text>
          </View>
        ) : null}

        <Field label={fr ? 'Valeurs' : 'Values'}>
          <View className="gap-[8px]">
            <View className="flex-row gap-[8px] pl-[48px]">
              {COLS.map((c) => <Text key={c} className="flex-1 text-center text-body-sm text-text-tertiary">{COL_LABEL[c][fr ? 'fr' : 'en']}</Text>)}
            </View>
            {(['od', 'os'] as Eye[]).map((e) => (
              <View key={e} className="flex-row items-center gap-[8px]">
                <Text className="w-[40px] text-body-md font-medium text-text-primary">{e === 'od' ? 'OD' : fr ? 'OG' : 'OS'}</Text>
                {COLS.map((c) => cell(e, c))}
              </View>
            ))}
          </View>
        </Field>

        <View className="flex-row gap-[12px]">
          <TextField className="flex-1" label={fr ? 'EP droite' : 'PD right'} value={pdR} onChangeText={setPdR} keyboardType="decimal-pad" />
          <TextField className="flex-1" label={fr ? 'EP gauche' : 'PD left'} value={pdL} onChangeText={setPdL} keyboardType="decimal-pad" />
          <TextField className="flex-1" label={fr ? 'ou EP totale' : 'or PD total'} value={pd} onChangeText={setPd} keyboardType="decimal-pad" />
        </View>
        <View className="flex-row gap-[12px]">
          <TextField className="flex-[2]" label={fr ? 'Prescripteur, clinique' : 'Prescriber, clinic'} value={prescriber} onChangeText={setPrescriber} />
          <TextField className="flex-1" label={fr ? 'Date de l’examen' : 'Exam date'} placeholder="2026-11-03" value={date} onChangeText={setDate} />
        </View>
      </View>
    </Sheet>
  );
}

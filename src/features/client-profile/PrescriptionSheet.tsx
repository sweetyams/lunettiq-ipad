import { View, Text, TextInput } from 'react-native';
import { useState } from 'react';
import { Sheet, TextField, Field, ChoiceChips, kitColors } from '@/src/ui/kit';
import { useCreatePrescription } from '@/src/api/usePrescriptions';
import { toast } from '@/src/ui/useToastStore';
import type { CreatePrescriptionPayload } from '@/src/api/prescriptions.types';

interface PrescriptionSheetProps {
  clientId: string;
  visible: boolean;
  onClose: () => void;
}

type Col = 'sph' | 'cyl' | 'axis' | 'add';
type Eye = 'od' | 'os';
const COLS: Array<{ key: Col; label: string; placeholder: string }> = [
  { key: 'sph', label: 'SPH', placeholder: '-1.25' },
  { key: 'cyl', label: 'CYL', placeholder: '-0.50' },
  { key: 'axis', label: 'Axis', placeholder: '90' },
  { key: 'add', label: 'Add', placeholder: '+2.00' },
];
const RANGE: Record<Col, [number, number]> = { sph: [-20, 20], cyl: [-10, 10], axis: [1, 180], add: [0.25, 4] };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parse(v: string): number | undefined {
  const t = v.trim().replace(',', '.').replace('−', '-');
  if (!t) return undefined;
  if (/^pl(ano)?$/i.test(t)) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function cellError(col: Col, v: string): boolean {
  const n = parse(v);
  if (n === undefined) return false;
  if (Number.isNaN(n)) return true;
  const [min, max] = RANGE[col];
  if (n < min || n > max) return true;
  if (col === 'axis') return !Number.isInteger(n);
  return Math.round(n * 4) !== n * 4; // quarter-diopter steps
}

export function PrescriptionSheet({ clientId, visible, onClose }: PrescriptionSheetProps) {
  const create = useCreatePrescription();
  const [grid, setGrid] = useState<Record<Eye, Record<Col, string>>>({
    od: { sph: '', cyl: '', axis: '', add: '' },
    os: { sph: '', cyl: '', axis: '', add: '' },
  });
  const [pdMode, setPdMode] = useState<'single' | 'dual'>('single');
  const [pd, setPd] = useState('');
  const [pdR, setPdR] = useState('');
  const [pdL, setPdL] = useState('');
  const [date, setDate] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [clinic, setClinic] = useState('');

  const set = (eye: Eye, col: Col) => (v: string) => setGrid((g) => ({ ...g, [eye]: { ...g[eye], [col]: v } }));

  const badCells = (['od', 'os'] as Eye[]).flatMap((e) => COLS.filter((c) => cellError(c.key, grid[e][c.key])).map((c) => `${e.toUpperCase()} ${c.label}`));
  const missingAxis = (['od', 'os'] as Eye[]).filter((e) => grid[e].cyl.trim() && parse(grid[e].cyl) !== 0 && !grid[e].axis.trim()).map((e) => e.toUpperCase());
  const hasSphere = !!(grid.od.sph.trim() || grid.os.sph.trim());
  const dateError = date.trim() && (!ISO_DATE.test(date.trim()) || Number.isNaN(Date.parse(date.trim())) || Date.parse(date.trim()) > Date.now()) ? 'Use YYYY-MM-DD, not in the future.' : null;
  const gridError = badCells.length
    ? `Check ${badCells.join(', ')}: SPH ±20, CYL ±10 in 0.25 steps, axis 1–180, add 0.25–4.`
    : missingAxis.length ? `${missingAxis.join(' and ')}: cylinder needs an axis.` : null;
  const canSave = hasSphere && !gridError && !dateError;

  const save = async () => {
    const n = (v: string) => { const x = parse(v); return x === undefined || Number.isNaN(x) ? undefined : x; };
    const payload: CreatePrescriptionPayload = {
      clientId,
      sphereOd: n(grid.od.sph), cylinderOd: n(grid.od.cyl), axisOd: n(grid.od.axis), addOd: n(grid.od.add),
      sphereOs: n(grid.os.sph), cylinderOs: n(grid.os.cyl), axisOs: n(grid.os.axis), addOs: n(grid.os.add),
      ...(pdMode === 'single' ? { pdSingle: n(pd) } : { pdRight: n(pdR), pdLeft: n(pdL) }),
      prescribedAt: date.trim() || undefined,
      prescribedBy: prescriber,
      clinicName: clinic,
    };
    try {
      await create.mutateAsync(payload);
      toast.success('Prescription added', 'It’s waiting for an optician to verify.');
      onClose();
    } catch {
      toast.error('Couldn’t add the prescription', 'Check the connection and try again. Values are still here.');
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title="Add prescription"
      subtitle="From an exam here or an outside prescription. An optician verifies it before it’s used for an order."
      primary={{ label: 'Add prescription', onPress: save, disabled: !canSave, loading: create.isPending }}
    >
      <View className="gap-[24px]">
        <Field label="Values" error={gridError} hint="Plano: type 0 or “pl”. Leave blank what isn’t on the prescription.">
          <View className="border border-border rounded-md">
            <View className="flex-row items-center px-[12px] min-h-[36px]">
              <View className="w-[96px]" />
              {COLS.map((c) => <Text key={c.key} className="flex-1 text-caption-sm uppercase text-text-tertiary px-[6px]">{c.label}</Text>)}
            </View>
            {(['od', 'os'] as Eye[]).map((eye) => (
              <View key={eye} className="flex-row items-center px-[12px] py-[8px] border-t border-border">
                <Text className="w-[96px] text-body-md text-text-primary">
                  {eye.toUpperCase()} <Text className="text-text-tertiary">{eye === 'od' ? 'Right' : 'Left'}</Text>
                </Text>
                {COLS.map((c) => {
                  const bad = cellError(c.key, grid[eye][c.key]);
                  return (
                    <View key={c.key} className="flex-1 px-[6px]">
                      <TextInput
                        value={grid[eye][c.key]}
                        onChangeText={set(eye, c.key)}
                        placeholder={c.placeholder}
                        placeholderTextColor={kitColors.iconMuted}
                        keyboardType="numbers-and-punctuation"
                        accessibilityLabel={`${eye === 'od' ? 'Right' : 'Left'} eye ${c.label}`}
                        className={`bg-bg-page border rounded-md px-[10px] min-h-[44px] text-body-md text-text-primary text-right ${bad ? 'border-error' : 'border-border'}`}
                        style={{ fontVariant: ['tabular-nums'] }}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </Field>

        <Field label="Pupillary distance">
          <ChoiceChips options={[{ key: 'single', label: 'One number' }, { key: 'dual', label: 'Right and left' }]} value={pdMode} onChange={(m: 'single' | 'dual' | null) => setPdMode(m ?? 'single')} />
          <View className="flex-row gap-[16px] mt-[4px]">
            {pdMode === 'single' ? (
              <TextField className="w-[200px]" label="PD (mm)" value={pd} onChangeText={setPd} placeholder="63" keyboardType="decimal-pad" />
            ) : (
              <>
                <TextField className="w-[200px]" label="Right (mm)" value={pdR} onChangeText={setPdR} placeholder="31.5" keyboardType="decimal-pad" />
                <TextField className="w-[200px]" label="Left (mm)" value={pdL} onChangeText={setPdL} placeholder="31.5" keyboardType="decimal-pad" />
              </>
            )}
          </View>
        </Field>

        <View className="flex-row gap-[16px]">
          <TextField className="flex-1" label="Exam date" value={date} onChangeText={setDate} error={dateError} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          <TextField className="flex-1" label="Prescriber" value={prescriber} onChangeText={setPrescriber} placeholder="Dr. …" autoCapitalize="words" />
          <TextField className="flex-1" label="Clinic" value={clinic} onChangeText={setClinic} autoCapitalize="words" />
        </View>
      </View>
    </Sheet>
  );
}

/**
 * Measurements sheet: PD, height/OC, in-store lensometer reading, optician and notes,
 * rendered from the measurement template (measurements.ts) so another store can
 * swap the field list. Each save adds a dated reading; earlier readings stay.
 */
import { useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Field, Sheet, TextField, kitColors } from '@/src/ui/kit';
import { useClient, useUpdateEnrichment } from '@/src/api/useClients';
import { useOperatorStore } from '@/src/features/auth/useOperatorStore';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import {
  LUNETTIQ_MEASUREMENTS, cleanValues, readMeasurements, validateRecord, withMeasurement,
  type MeasurementField, type MeasurementTemplate,
} from './measurements';

interface Props {
  clientId: string;
  visible: boolean;
  onClose: () => void;
  /** Frame the heights are taken in (from the visit tray). */
  frame?: string | null;
  template?: MeasurementTemplate;
}

function EyeInput({ value, onChange, label, error, keyboard }: { value: string; onChange: (v: string) => void; label: string; error?: string; keyboard: 'decimal-pad' | 'default' }) {
  return (
    <View className="flex-1 gap-[4px]">
      <Text className="text-body-sm text-text-tertiary">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        accessibilityLabel={label}
        placeholderTextColor={kitColors.iconMuted}
        className={`bg-bg-page border rounded-md px-[12px] min-h-[44px] text-body-md text-text-primary ${error ? 'border-error' : 'border-border'}`}
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </View>
  );
}

export function MeasurementsSheet({ clientId, visible, onClose, frame, template = LUNETTIQ_MEASUREMENTS }: Props) {
  const lang = useLangStore((s) => s.uiLang);
  const operator = useOperatorStore((s) => s.activeOperator);
  const { data: client } = useClient(clientId);
  const update = useUpdateEnrichment();
  const last = useMemo(() => readMeasurements(client?.enrichment?.customFields)[0], [client]);
  // Start from the last reading so a re-measure is a quick edit, and default the optician to whoever is signed in.
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...(last?.values ?? {}), opticianName: last?.values.opticianName ?? operator?.name ?? '' }));
  const errors = validateRecord(template, values);
  const hasErrors = Object.keys(errors).length > 0;
  const set = (k: string) => (v: string) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const clean = cleanValues(template, values);
    if (!Object.keys(clean).length) { onClose(); return; }
    const record = {
      id: `m_${Date.now()}`,
      templateId: template.id,
      templateVersion: template.version,
      takenAt: new Date().toISOString(),
      values: clean,
      frame: frame ?? null,
    };
    try {
      await update.mutateAsync({ clientId, data: { customFields: withMeasurement(client?.enrichment?.customFields, record) } });
      toast.success(lang === 'fr' ? 'Mesures enregistrées' : 'Measurements saved');
      onClose();
    } catch {
      toast.error(lang === 'fr' ? 'Mesures non enregistrées' : 'Couldn’t save measurements', lang === 'fr' ? 'Vérifiez la connexion et réessayez.' : 'Check the connection and try again.');
    }
  };

  const renderField = (f: MeasurementField) => {
    const label = f.label[lang];
    const hint = f.hint?.[lang];
    if (f.perEye) {
      const keyboard = f.kind === 'mm' ? 'decimal-pad' as const : 'default' as const;
      return (
        <Field key={f.key} label={label} hint={hint} error={errors[`${f.key}.od`] ?? errors[`${f.key}.os`]}>
          <View className="flex-row gap-[12px]">
            <EyeInput label={lang === 'fr' ? 'OD (droit)' : 'OD (right)'} value={values[`${f.key}.od`] ?? ''} onChange={set(`${f.key}.od`)} error={errors[`${f.key}.od`]} keyboard={keyboard} />
            <EyeInput label={lang === 'fr' ? 'OG (gauche)' : 'OS (left)'} value={values[`${f.key}.os`] ?? ''} onChange={set(`${f.key}.os`)} error={errors[`${f.key}.os`]} keyboard={keyboard} />
          </View>
        </Field>
      );
    }
    return (
      <TextField
        key={f.key}
        label={label}
        hint={hint}
        error={errors[f.key]}
        value={values[f.key] ?? ''}
        onChangeText={set(f.key)}
        keyboardType={f.kind === 'mm' ? 'decimal-pad' : 'default'}
        multiline={f.kind === 'note'}
      />
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={lang === 'fr' ? 'Mesures' : 'Measurements'}
      subtitle={frame ? (lang === 'fr' ? `Hauteurs prises dans ${frame}` : `Heights taken in ${frame}`) : (lang === 'fr' ? 'Tout est facultatif. Chaque enregistrement garde l’historique.' : 'Everything is optional. Each save keeps the history.')}
      secondary={{ label: lang === 'fr' ? 'Annuler' : 'Cancel', onPress: onClose }}
      primary={{ label: lang === 'fr' ? 'Enregistrer' : 'Save', onPress: save, disabled: hasErrors, loading: update.isPending }}
    >
      <View className="gap-[24px]">
        {template.groups.map((g) => (
          <View key={g.key} className="gap-[16px]">
            <Text className="text-caption-sm uppercase text-text-tertiary">{g.label[lang]}</Text>
            {g.fields.map(renderField)}
          </View>
        ))}
      </View>
    </Sheet>
  );
}

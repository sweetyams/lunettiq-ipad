import { View, Text } from 'react-native';
import { MeasurementsSection } from '../ClientFileSections';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { useClientEnrichment } from '@/src/api/useClients';
import { useInteractions } from '@/src/api/useInteractions';
import { Badge, KeyValue, Section, formatDate } from '@/src/ui/kit';
import type { Prescription } from '@/src/api/prescriptions.types';
import { formatDiopter, formatPlain, rxStatus, rxTypeLabel } from './rxFormat';

interface ClinicalTabProps {
  clientId: string;
  onAddPrescription: () => void;
  onEditFit: () => void;
  onAddClinicalNote: () => void;
}

const COLS = ['SPH', 'CYL', 'Axis', 'Add', 'PD'] as const;

function RxTable({ rx }: { rx: Prescription }) {
  const rows = [
    { eye: 'OD', label: 'Right', values: [formatDiopter(rx.sphereOd), formatDiopter(rx.cylinderOd), formatPlain(rx.axisOd), formatDiopter(rx.addOd), formatPlain(rx.pdRight)] },
    { eye: 'OS', label: 'Left', values: [formatDiopter(rx.sphereOs), formatDiopter(rx.cylinderOs), formatPlain(rx.axisOs), formatDiopter(rx.addOs), formatPlain(rx.pdLeft)] },
  ];
  const num = { fontVariant: ['tabular-nums' as const] };
  return (
    <View className="border border-border rounded-md mt-[12px]">
      <View className="flex-row px-[12px] min-h-[36px] items-center">
        <View className="w-[64px]" />
        {COLS.map((c) => <Text key={c} className="flex-1 text-caption-sm uppercase text-text-tertiary text-right">{c}</Text>)}
      </View>
      {rows.map((r) => (
        <View key={r.eye} className="flex-row px-[12px] min-h-[44px] items-center border-t border-border">
          <Text className="w-[64px] text-body-sm text-text-secondary">{r.eye} <Text className="text-text-dim">{r.label}</Text></Text>
          {r.values.map((v, i) => <Text key={COLS[i]} className="flex-1 text-body-md text-text-primary text-right" style={num}>{v}</Text>)}
        </View>
      ))}
    </View>
  );
}

function RxEntry({ rx, first }: { rx: Prescription; first: boolean }) {
  const status = rxStatus(rx);
  const date = formatDate(rx.prescribedAt ?? rx.createdAt);
  const meta = [rx.type ? rxTypeLabel(rx) : null, rx.prescribedBy, rx.clinicName].filter(Boolean).join(' · ');
  return (
    <View className={`px-[20px] py-[16px] ${first ? '' : 'border-t border-border'}`}>
      <View className="flex-row items-center justify-between gap-[12px]">
        <Text className="text-body-lg font-medium text-text-primary">{date ? `Exam ${date}` : rxTypeLabel(rx)}</Text>
        <Badge tone={status.tone} dot={status.tone !== 'neutral'}>{status.label}</Badge>
      </View>
      {meta ? <Text className="text-body-sm text-text-tertiary mt-[2px]">{meta}</Text> : null}
      {rx.status === 'discrepancy' && rx.notes ? <Text className="text-body-sm text-error mt-[4px]">{rx.notes}</Text> : null}
      <RxTable rx={rx} />
    </View>
  );
}

export function ClinicalTab({ clientId, onAddPrescription, onEditFit, onAddClinicalNote }: ClinicalTabProps) {
  const { data: prescriptions = [], isLoading: rxLoading } = usePrescriptions({ clientId });
  const { data: enrichment } = useClientEnrichment(clientId);
  const { data: history } = useInteractions(clientId);
  const clinicalNotes = (history?.interactions ?? [])
    .filter((i) => (i.metadata as Record<string, unknown> | null)?.category === 'clinical')
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

  const sorted = prescriptions; // newest first, from the hook
  const frame = enrichment?.frameWidthMm;
  const bridge = enrichment?.bridgeWidthMm;
  const sizing = frame && bridge
    ? `${Math.max(47, frame - 3)}–${Math.min(55, frame + 3)} □ ${Math.max(16, bridge - 2)}–${Math.min(24, bridge + 2)}`
    : null;

  return (
    <View className="flex-row gap-[20px] items-start">
      <View className="flex-[3] gap-[20px]">
        <Section title="Prescriptions" count={sorted.length || undefined} padded={false} action={{ label: 'Add', onPress: onAddPrescription }}>
          {rxLoading ? (
            <Text className="text-body-sm text-text-tertiary px-[20px] pb-[20px]">Loading…</Text>
          ) : sorted.length === 0 ? (
            <Text className="text-body-sm text-text-tertiary px-[20px] pb-[20px]">None on file. Add one from an exam or an outside prescription.</Text>
          ) : (
            sorted.map((rx, i) => <RxEntry key={rx.id} rx={rx} first={i === 0} />)
          )}
        </Section>

        <Section title="Clinical notes" count={clinicalNotes.length || undefined} padded={clinicalNotes.length === 0} action={{ label: 'Add', onPress: onAddClinicalNote }}>
          {clinicalNotes.length === 0 ? (
            <Text className="text-body-sm text-text-tertiary">Staff only. None yet.</Text>
          ) : (
            clinicalNotes.map((n, i) => (
              <View key={n.id} className={`px-[20px] py-[14px] gap-[4px] ${i > 0 ? 'border-t border-border' : ''}`}>
                <View className="flex-row items-baseline justify-between gap-[12px]">
                  <Text className="text-body-md font-medium text-text-primary flex-shrink" numberOfLines={1}>{n.subject || 'Clinical note'}</Text>
                  <Text className="text-body-sm text-text-tertiary">{formatDate(n.occurredAt)}</Text>
                </View>
                {n.body ? <Text className="text-body-md text-text-secondary">{n.body}</Text> : null}
              </View>
            ))
          )}
        </Section>
      </View>

      <View className="flex-[2] gap-[20px]">
        <MeasurementsSection clientId={clientId} />
        <Section title="Fit" action={{ label: 'Edit', onPress: onEditFit }}>
          <KeyValue
            mono
            rows={[
              { label: 'Face shape', value: enrichment?.faceShape },
              { label: 'Lens width', value: frame ? `${frame} mm` : null },
              { label: 'Bridge width', value: bridge ? `${bridge} mm` : null },
            ]}
          />
          <Text className="text-body-sm text-text-dim mt-[12px]">LiDAR measuring arrives with Phase 3.</Text>
        </Section>

        <Section title="Sizing guidance">
          {sizing ? (
            <>
              <Text className="text-display-sm text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{sizing}</Text>
              <Text className="text-body-sm text-text-tertiary mt-[6px]">Lens width □ bridge, in mm, from the fit measurements.</Text>
            </>
          ) : (
            <Text className="text-body-sm text-text-tertiary">Add frame and bridge width to see sizes that fit.</Text>
          )}
        </Section>
      </View>
    </View>
  );
}

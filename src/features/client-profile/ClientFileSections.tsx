/**
 * Profile sections for the new client-file facts: handoff, frame collection and
 * measurements. Each owns its sheet so screens just drop the section in.
 */
import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Badge, KeyValue, Section, formatDate } from '@/src/ui/kit';
import { useClient } from '@/src/api/useClients';
import { useLangStore } from '@/src/i18n';
import { COLLECTION_LABELS, HANDOFF_LABELS, missingRoles, readCollection, readHandoff } from './clientFile';
import { LUNETTIQ_MEASUREMENTS, fieldKeys, readMeasurements } from './measurements';
import { HandoffSheet, CollectionSheet } from './ClientFileSheets';
import { MeasurementsSheet } from './MeasurementsSheet';

function Quiet({ children }: { children: string }) {
  return <Text className="text-body-sm text-text-tertiary">{children}</Text>;
}

export function HandoffSection({ clientId }: { clientId: string }) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const { data: client } = useClient(clientId);
  const h = useMemo(() => readHandoff(client?.enrichment?.customFields), [client]);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Section title={fr ? 'Pour la suite' : 'Coming back for'} action={{ label: h ? (fr ? 'Modifier' : 'Edit') : (fr ? 'Ajouter' : 'Add'), onPress: () => setOpen(true) }}>
        {h ? (
          <View className="gap-[8px]">
            {h.reasons.length ? (
              <View className="flex-row flex-wrap gap-[6px]">
                {h.reasons.map((r) => <Badge key={r} tone="info">{HANDOFF_LABELS[r][lang]}</Badge>)}
                {h.when.trim() ? <Badge tone="outline">{fr ? `D’ici ${h.when}` : `By ${h.when}`}</Badge> : null}
              </View>
            ) : null}
            {h.note.trim() ? <Text className="text-body-md text-text-secondary">{h.note}</Text> : null}
            {h.updatedBy || h.updatedAt ? (
              <Text className="text-body-sm text-text-tertiary">{[h.updatedBy, h.updatedAt ? formatDate(h.updatedAt) : null].filter(Boolean).join(' · ')}</Text>
            ) : null}
          </View>
        ) : (
          <Quiet>{fr ? 'Rien de noté. Ajoutez-le pour qu’un collègue puisse continuer.' : 'Nothing noted. Add it so a colleague can pick up.'}</Quiet>
        )}
      </Section>
      {open ? <HandoffSheet clientId={clientId} visible onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function CollectionSection({ clientId }: { clientId: string }) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const { data: client } = useClient(clientId);
  const pairs = useMemo(() => readCollection(client?.enrichment?.customFields), [client]);
  const missing = missingRoles(pairs);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Section title={fr ? 'Collection' : 'Frame collection'} count={pairs.length || undefined} action={{ label: fr ? 'Modifier' : 'Edit', onPress: () => setOpen(true) }}>
        <View className="gap-[12px]">
          {pairs.length ? (
            <KeyValue rows={pairs.map((p) => ({ label: COLLECTION_LABELS[p.role][lang], value: p.frame }))} />
          ) : (
            <Quiet>{fr ? 'Aucune paire notée.' : 'No pairs noted yet.'}</Quiet>
          )}
          {missing.length ? (
            <View className="flex-row flex-wrap items-center gap-[6px]">
              <Text className="text-body-sm text-text-tertiary">{fr ? 'Il manque' : 'Missing'}</Text>
              {missing.map((r) => <Badge key={r} tone="warning" dot>{COLLECTION_LABELS[r][lang]}</Badge>)}
            </View>
          ) : null}
        </View>
      </Section>
      {open ? <CollectionSheet clientId={clientId} visible onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function MeasurementsSection({ clientId, frame }: { clientId: string; frame?: string | null }) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const { data: client } = useClient(clientId);
  const history = useMemo(() => readMeasurements(client?.enrichment?.customFields), [client]);
  const last = history[0];
  const [open, setOpen] = useState(false);
  const rows = last ? LUNETTIQ_MEASUREMENTS.groups.flatMap((g) => g.fields).flatMap((f) => {
    const keys = fieldKeys(f);
    const vals = keys.map((k) => last.values[k]).filter(Boolean);
    if (!vals.length) return [];
    const value = f.perEye ? `${last.values[keys[0]!] ?? '–'} / ${last.values[keys[1]!] ?? '–'}` : vals[0]!;
    return [{ label: f.label[lang], value: f.kind === 'mm' ? `${value} mm` : value }];
  }) : [];
  return (
    <>
      <Section title={fr ? 'Mesures' : 'Measurements'} action={{ label: last ? (fr ? 'Nouvelle mesure' : 'New reading') : (fr ? 'Ajouter' : 'Add'), onPress: () => setOpen(true) }}>
        {last ? (
          <View className="gap-[8px]">
            <KeyValue mono rows={rows} />
            <Text className="text-body-sm text-text-tertiary">
              {[formatDate(last.takenAt), last.frame, history.length > 1 ? (fr ? `${history.length} relevés` : `${history.length} readings`) : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : (
          <Quiet>{fr ? 'EP, hauteurs, lecture en magasin : tout est facultatif.' : 'PD, heights, an in-store reading: all optional.'}</Quiet>
        )}
      </Section>
      {open ? <MeasurementsSheet clientId={clientId} frame={frame} visible onClose={() => setOpen(false)} /> : null}
    </>
  );
}

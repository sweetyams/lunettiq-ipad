/**
 * Visit spine UI (V2 1.1): the step rail and the non-Frames steps. The Frames step is the
 * existing catalogue + tray in the visit screen. Every step reuses an existing sheet, so
 * this adds structure, not new data paths.
 */
import { useState, type ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useClientEnrichment } from '@/src/api/useClients';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { useMultiPairQuestionnaire } from '@/src/api/useMultiPair';
import { useSessionStore, type FrameTried } from '@/src/features/session/useSessionStore';
import { ContactEditSheet } from '@/src/features/client-profile/ContactEditSheet';
import { PrescriptionSheet } from '@/src/features/client-profile/PrescriptionSheet';
import { FitProfileEditSheet } from '@/src/features/client-profile/FitProfileEditSheet';
import { LifestyleQuestionnaireSheet } from '@/src/features/client-profile/LifestyleQuestionnaireSheet';
import { Badge, Button, ChoiceChips, ListRow, Section, TextField, VerdictPicker, formatDate, formatPhone, kitColors } from '@/src/ui/kit';
import { useT, type TKey } from '@/src/i18n';
import type { Client, ClientProfile } from '@/src/api/clients.types';
import { VISIT_STEPS, VISIT_PURPOSES, isSunPath, nextStep, prevStep, stepDone, type StepFacts, type VisitStep } from './steps';
import { RxCaptureSheet } from '@/src/features/rx/RxCaptureSheet';
import { MeasurementsSheet } from '@/src/features/client-profile/MeasurementsSheet';
import { readMeasurements, summarize } from '@/src/features/client-profile/measurements';
import { ContactCaptureSheet } from './VisitExtras';
import { HandoffSheet } from '@/src/features/client-profile/ClientFileSheets';
import { handoffLine, readHandoff } from '@/src/features/client-profile/clientFile';
import { useLangStore } from '@/src/i18n';

/** Facts that mark steps done, from the visit store and the client's file. */
export function useStepFacts(clientId: string, client: Client | undefined): StepFacts {
  const { purposes, framesTried } = useSessionStore();
  const { data: enrichment } = useClientEnrichment(clientId);
  const { data: rx } = usePrescriptions({ clientId });
  const { data: questionnaire } = useMultiPairQuestionnaire(clientId);
  return {
    purposes,
    hasContact: !!(client?.email || client?.phone),
    hasRx: (rx?.length ?? 0) > 0,
    hasFit: !!(enrichment?.frameWidthMm && enrichment?.bridgeWidthMm),
    hasLifestyle: Array.isArray(questionnaire) ? questionnaire.length > 0 : !!questionnaire,
    framesTried: framesTried.length,
    loved: framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length,
  };
}

export function VisitStepRail({ facts }: { facts: StepFacts }) {
  const tr = useT();
  const { step, setStep } = useSessionStore();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0 border-b border-border"
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10, gap: 6 }}>
      {VISIT_STEPS.map((s, i) => {
        const active = s === step;
        const done = stepDone(s, facts);
        return (
          <Pressable key={s} onPress={() => setStep(s)} accessibilityRole="tab" accessibilityState={{ selected: active }}
            className={`flex-row items-center gap-[8px] rounded-full px-[14px] min-h-[40px] ${active ? 'bg-bg-inverse' : ''}`}>
            <View className={`w-[22px] h-[22px] rounded-full items-center justify-center border ${active ? 'border-text-inverse' : done ? 'bg-success border-success' : 'border-border-strong'}`}>
              {done && !active ? <Check size={13} color={kitColors.inverse} strokeWidth={3} />
                : <Text className={`text-body-sm font-medium ${active ? 'text-text-inverse' : 'text-text-tertiary'}`}>{i + 1}</Text>}
            </View>
            <Text className={`text-body-md font-medium ${active ? 'text-text-inverse' : done ? 'text-text-primary' : 'text-text-secondary'}`}>
              {tr(`visit.steps.${s}` as TKey)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Back / Next under each step (Close has End visit instead of Next). */
export function StepFooter({ onEnd }: { onEnd: () => void }) {
  const tr = useT();
  const { step, setStep } = useSessionStore();
  const prev = prevStep(step);
  const next = nextStep(step);
  return (
    <View className="flex-row items-center gap-[8px] px-[24px] py-[12px] border-t border-border bg-bg-page">
      {prev ? <Button label={tr('visit.back')} variant="ghost" onPress={() => setStep(prev)} /> : null}
      <View className="flex-1" />
      {next ? <Button label={tr('visit.next', { step: tr(`visit.steps.${next}` as TKey) })} variant="primary" onPress={() => setStep(next)} />
        : <Button label={tr('visit.endVisit')} variant="primary" onPress={onEnd} />}
    </View>
  );
}

function StepPage({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, paddingBottom: 48, gap: 24, maxWidth: 880 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <View className="gap-[4px]">
        <Text className="text-display-sm text-text-primary">{title}</Text>
        {hint ? <Text className="text-body-md text-text-tertiary">{hint}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}

export function WelcomeStep({ client }: { client: Client }) {
  const tr = useT();
  const { purposes, togglePurpose, sessionNotes, setSessionNotes } = useSessionStore();
  const first = client.firstName || tr('floor.client');
  return (
    <StepPage title={tr('visit.welcomeTitle', { name: first })} hint={tr('visit.welcomeHint')}>
      <ChoiceChips
        multiple
        options={VISIT_PURPOSES.map((p) => ({ key: p, label: tr(`visit.purposes.${p}` as TKey) }))}
        value={purposes}
        onChange={(next: string[]) => {
          for (const p of VISIT_PURPOSES) if (next.includes(p) !== purposes.includes(p)) togglePurpose(p);
        }}
      />
      <TextField label={tr('visit.notes')} hint={tr('visit.notesHint')} value={sessionNotes} onChangeText={setSessionNotes} placeholder={tr('visit.notesPlaceholder')} multiline />
    </StepPage>
  );
}

type FileSheet = 'contact' | 'rx' | 'rxPhoto' | 'fit' | 'measure' | null;

export function FileStep({ client }: { client: Client }) {
  const tr = useT();
  const [sheet, setSheet] = useState<FileSheet>(null);
  const { data: enrichment } = useClientEnrichment(client.id);
  const { data: rx } = usePrescriptions({ clientId: client.id });
  const latest = rx?.[0];
  const contact = [client.email, formatPhone(client.phone)].filter(Boolean).join(' · ');
  const fit = enrichment?.frameWidthMm && enrichment?.bridgeWidthMm
    ? tr('visit.fitValue', { width: enrichment.frameWidthMm, bridge: enrichment.bridgeWidthMm }) : null;

  const fr = useLangStore((st) => st.uiLang) === 'fr';
  const { purposes } = useSessionStore();
  const sun = isSunPath(purposes);
  const measured = summarize(readMeasurements((client as ClientProfile).enrichment?.customFields)[0]);
  const row = (label: string, value: string | null, onPress: () => void, divider: boolean, opts?: { optional?: boolean; extra?: { label: string; onPress: () => void } }) => (
    <ListRow
      divider={divider}
      title={label}
      subtitle={value ?? undefined}
      trailing={
        <View className="flex-row items-center gap-[10px]">
          {value ? <Badge tone="success" dot>{tr('visit.onFile')}</Badge> : opts?.optional ? <Badge tone="neutral">{fr ? 'Facultatif' : 'Optional'}</Badge> : <Badge tone="warning" dot>{tr('visit.missing')}</Badge>}
          {opts?.extra ? <Button label={opts.extra.label} size="sm" variant={value ? 'secondary' : 'primary'} onPress={opts.extra.onPress} /> : null}
          <Button label={value ? tr('visit.edit') : tr('visit.add')} size="sm" onPress={onPress} />
        </View>
      }
    />
  );

  return (
    <StepPage title={tr('visit.fileTitle')} hint={tr('visit.fileHint')}>
      <Section padded={false}>
        {row(tr('visit.contact'), contact || null, () => setSheet('contact'), false)}
        {row(tr('visit.prescription'), latest ? (latest.prescribedAt ? tr('visit.rxExam', { date: formatDate(latest.prescribedAt) ?? '' }) : tr('visit.onFile')) : null, () => setSheet('rx'), true,
          { optional: sun, extra: { label: fr ? 'Photo' : 'Photo', onPress: () => setSheet('rxPhoto') } })}
        {row(fr ? 'Mesures (EP, hauteurs, lecture)' : 'Measurements (PD, heights, reading)', measured, () => setSheet('measure'), true, { optional: true })}
        {row(tr('visit.fit'), fit, () => setSheet('fit'), true)}
      </Section>
      {!latest && !sun ? (
        <Text className="text-body-sm text-text-tertiary">
          {fr ? 'Pas d’ordonnance? Lisez leur paire actuelle au frontofocomètre (Mesures) et commencez une sélection de montures à essayer.'
            : 'No prescription? Read their current pair on the lensometer (Measurements) and start pulling frames to try.'}
        </Text>
      ) : null}
      {sun ? <Text className="text-body-sm text-text-tertiary">{fr ? 'Solaires seulement : l’ordonnance est facultative.' : 'Sunglasses only: a prescription is optional.'}</Text> : null}
      {sheet === 'contact' ? <ContactEditSheet clientId={client.id} client={client} visible onClose={() => setSheet(null)} /> : null}
      {sheet === 'rx' ? <PrescriptionSheet clientId={client.id} visible onClose={() => setSheet(null)} /> : null}
      {sheet === 'fit' ? <FitProfileEditSheet clientId={client.id} visible onClose={() => setSheet(null)} /> : null}
      {sheet === 'rxPhoto' ? <RxCaptureSheet customerId={client.id} visible onClose={() => setSheet(null)} /> : null}
      {sheet === 'measure' ? <MeasurementsSheet clientId={client.id} visible onClose={() => setSheet(null)} /> : null}
    </StepPage>
  );
}

export function LifestyleStep({ client, done }: { client: Client; done: boolean }) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  return (
    <StepPage title={tr('visit.lifestyleTitle')} hint={done ? tr('visit.lifestyleDone') : tr('visit.lifestyleHint')}>
      <View className="flex-row">
        <Button label={tr('visit.openQuestionnaire')} variant={done ? 'secondary' : 'primary'} size="lg" onPress={() => setOpen(true)} />
      </View>
      {open ? <LifestyleQuestionnaireSheet clientId={client.id} visible onClose={() => setOpen(false)} /> : null}
    </StepPage>
  );
}

export function QuoteStep({ onOrder }: { onOrder: (frame: FrameTried) => void }) {
  const tr = useT();
  const { framesTried, updateFrameVerdict } = useSessionStore();
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked');
  return (
    <StepPage title={tr('visit.quoteTitle')} hint={tr('visit.quoteHint')}>
      {loved.length === 0 ? (
        <Text className="text-body-md text-text-tertiary">{tr('visit.quoteEmpty')}</Text>
      ) : (
        <Section padded={false}>
          {loved.map((f, i) => (
            <ListRow key={f.id} divider={i > 0} title={f.productName}
              trailing={
                <View className="flex-row items-center gap-[10px]">
                  <VerdictPicker value={f.verdict ?? null} label={f.productName} onChange={(v) => updateFrameVerdict(f.id, v)} />
                  <Button label={tr('visit.order')} size="sm" variant="primary" onPress={() => onOrder(f)} />
                </View>
              } />
          ))}
        </Section>
      )}
    </StepPage>
  );
}

export function CloseStep({ minutes, onEnd, client }: { minutes: number; onEnd: () => void; client?: Client }) {
  const tr = useT();
  const lang = useLangStore((st) => st.uiLang);
  const fr = lang === 'fr';
  const { framesTried, activeClientId } = useSessionStore();
  const clientId = client?.id ?? activeClientId;
  const [open, setOpen] = useState<null | 'contact' | 'handoff'>(null);
  const handoff = handoffLine(readHandoff((client as ClientProfile | undefined)?.enrichment?.customFields), lang);
  const loved = framesTried.filter((f) => f.verdict === 'loved' || f.verdict === 'liked').length;
  return (
    <StepPage title={tr('visit.closeTitle')} hint={tr('visit.closeSummary', { tried: framesTried.length, loved, minutes })}>
      <Section padded={false}>
        <ListRow title={fr ? 'Leur envoyer leur sélection' : 'Send them their choices'} subtitle={fr ? 'Leurs montures aimées, par texto ou courriel. Aucun marketing.' : 'Their loved frames by text or email. No marketing.'}
          trailing={<Button label={fr ? 'Envoyer' : 'Send'} size="sm" onPress={() => setOpen('contact')} />} />
        <ListRow divider title={fr ? 'Pour la suite' : 'Coming back for'} subtitle={handoff ?? (fr ? 'Solaires, 2e paire, voyage… pour qu’un collègue puisse continuer.' : 'Sunglasses, a second pair, travel… so a colleague can pick up.')}
          trailing={<Button label={handoff ? (fr ? 'Modifier' : 'Edit') : (fr ? 'Ajouter' : 'Add')} size="sm" onPress={() => setOpen('handoff')} />} />
      </Section>
      <View className="flex-row">
        <Button label={tr('visit.endVisit')} variant="primary" size="lg" onPress={onEnd} />
      </View>
      {open === 'contact' && clientId ? <ContactCaptureSheet visible clientId={clientId} onClose={() => setOpen(null)} /> : null}
      {open === 'handoff' && clientId ? <HandoffSheet visible clientId={clientId} onClose={() => setOpen(null)} /> : null}
    </StepPage>
  );
}

export type { VisitStep };

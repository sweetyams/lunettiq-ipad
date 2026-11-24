/**
 * One follow-up (gap checklist, Follow-ups): what it's about and what was discussed,
 * then one clear "Follow up" button. The message opens prefilled in Messages/Mail;
 * the contact is logged on Foundry. Calls are logged with their outcome.
 */
import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ChoiceChips, Field, KeyValue, Section, Sheet, TextField, formatDate, formatPhone } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import { useClient, useClientProductInteractions, useClientTryonSessions } from '@/src/api/useClients';
import { useLogFollowUpContact, useUpdateFollowUp, type ContactOutcome } from '@/src/api/useHotLeads';
import type { FollowUp } from '@/src/api/hotLeadsMapping';
import { MessageSheet } from '@/src/features/messages/MessageSheet';
import { joinFrames } from '@/src/features/messages/templates';
import { handoffLine, readHandoff } from '@/src/features/client-profile/clientFile';

type CallResult = 'reached' | 'voicemail' | 'no_answer' | 'booked' | 'bought' | 'not_interested';

const CALL_TO_CONTACT: Record<CallResult, { outcome: ContactOutcome; status?: string }> = {
  reached: { outcome: 'reached', status: 'contacted' },
  voicemail: { outcome: 'voicemail', status: 'contacted' },
  no_answer: { outcome: 'no_answer' },
  booked: { outcome: 'scheduled_callback', status: 'contacted' },
  bought: { outcome: 'converted', status: 'converted' },
  not_interested: { outcome: 'declined', status: 'archived' },
};

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());

export function FollowUpSheet({ item, onClose }: { item: FollowUp; onClose: () => void }) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const router = useRouter();
  const { data: client } = useClient(item.clientId);
  const { data: sessions } = useClientTryonSessions(item.clientId);
  const { data: interactions } = useClientProductInteractions(item.clientId);
  const logContact = useLogFollowUpContact();
  const update = useUpdateFollowUp();
  const [composing, setComposing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [result, setResult] = useState<CallResult | null>(null);
  const [notes, setNotes] = useState('');

  const lastVisit = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    return list.slice().sort((a, b) => Date.parse(b.startedAt ?? b.createdAt) - Date.parse(a.startedAt ?? a.createdAt))[0];
  }, [sessions]);
  const liked = useMemo(() => {
    const list = Array.isArray(interactions) ? interactions : [];
    const names = list
      .filter((i) => i.type === 'liked' || (i.type as string) === 'loved' || i.type === 'tried_on')
      .sort((a, b) => Number(b.type === 'liked') - Number(a.type === 'liked'))
      .map((i) => i.product?.title)
      .filter((t): t is string => !!t)
      .map(titleCase);
    return [...new Set(names)].slice(0, 4);
  }, [interactions]);
  const frames = liked.length ? liked : item.frame ? [item.frame] : [];
  const handoff = handoffLine(readHandoff(client?.enrichment?.customFields), lang);
  const firstName = client?.firstName ?? item.clientName.split(' ')[0];

  const saveCall = async () => {
    if (!result) return;
    const map = CALL_TO_CONTACT[result];
    try {
      await logContact.mutateAsync({ opportunityId: item.id, type: 'call', outcome: map.outcome, notes: notes.trim() || undefined });
      if (map.status) await update.mutateAsync({ id: item.id, status: map.status }).catch(() => undefined);
      toast.success(fr ? 'Appel noté' : 'Call logged');
      if (result === 'booked') { onClose(); router.push(`/appointments?book=${item.clientId}`); return; }
      onClose();
    } catch {
      toast.error(fr ? 'Appel non noté' : 'Couldn’t log the call');
    }
  };

  return (
    <>
      <Sheet
        visible={!composing && !logging}
        onClose={onClose}
        wide
        title={item.clientName}
        subtitle={[fr ? `Jour ${item.day}` : `Day ${item.day}`, item.phone ? formatPhone(item.phone) : null, client?.email].filter(Boolean).join(' · ')}
        secondary={{ label: fr ? 'Noter un appel' : 'Log a call', onPress: () => setLogging(true) }}
        primary={{ label: fr ? 'Faire le suivi' : 'Follow up', onPress: () => setComposing(true) }}
      >
        <View className="gap-[20px]">
          <Section title={fr ? 'De quoi il s’agit' : 'What it’s about'}>
            <KeyValue rows={[
              { label: fr ? 'Montures aimées' : 'Frames they liked', value: frames.length ? joinFrames(frames, lang) : null },
              { label: fr ? 'Dernière visite' : 'Last visit', value: lastVisit ? formatDate(lastVisit.startedAt ?? lastVisit.createdAt) : null },
              { label: fr ? 'Revient pour' : 'Coming back for', value: handoff },
              { label: fr ? 'Signaux' : 'Signals', value: item.signalsLabel },
              { label: fr ? 'Intérêt' : 'Interest', value: item.priority === 'hot' ? (fr ? 'Très intéressé' : 'Very interested') : item.priority === 'warm' ? (fr ? 'Intéressé' : 'Interested') : (fr ? 'À relancer doucement' : 'Gentle nudge') },
            ]} />
          </Section>
          <Section title={fr ? 'Ce qui a été dit' : 'What was discussed'}>
            {lastVisit?.notes ? <Text className="text-body-md text-text-secondary">{lastVisit.notes}</Text>
              : <Text className="text-body-sm text-text-tertiary">{fr ? 'Aucune note de visite.' : 'No visit notes.'}</Text>}
            {client?.enrichment?.internalNotes ? (
              <Text className="text-body-sm text-text-tertiary mt-[8px]">{client.enrichment.internalNotes}</Text>
            ) : null}
          </Section>
          <View className="flex-row gap-[8px]">
            <Button label={fr ? 'Dossier client' : 'Client file'} size="sm" variant="ghost" onPress={() => { onClose(); router.push(`/clients/${item.clientId}`); }} />
          </View>
        </View>
      </Sheet>

      <Sheet
        visible={logging}
        onClose={() => setLogging(false)}
        title={fr ? 'Noter un appel' : 'Log a call'}
        secondary={{ label: fr ? 'Retour' : 'Back', onPress: () => setLogging(false) }}
        primary={{ label: fr ? 'Enregistrer' : 'Save', onPress: saveCall, disabled: !result, loading: logContact.isPending }}
      >
        <View className="gap-[20px]">
          <Field label={fr ? 'Résultat' : 'How did it go?'}>
            <ChoiceChips<CallResult>
              options={[
                { key: 'reached', label: fr ? 'Joint' : 'Reached' },
                { key: 'voicemail', label: fr ? 'Message laissé' : 'Left voicemail' },
                { key: 'no_answer', label: fr ? 'Pas de réponse' : 'No answer' },
                { key: 'booked', label: fr ? 'Rendez-vous pris' : 'Booked a visit' },
                { key: 'bought', label: fr ? 'A acheté' : 'Bought' },
                { key: 'not_interested', label: fr ? 'Pas intéressé' : 'Not interested' },
              ]}
              value={result}
              onChange={setResult}
            />
          </Field>
          <TextField label={fr ? 'Notes' : 'Notes'} value={notes} onChangeText={setNotes} multiline />
        </View>
      </Sheet>

      {composing ? (
        <MessageSheet
          visible
          onClose={() => setComposing(false)}
          recipient={{ firstName, phone: item.phone ?? client?.phone, email: client?.email }}
          templates={['follow_up_check_in', 'visit_choices', 'shortlist']}
          vars={{ frames: frames.length ? joinFrames(frames.slice(0, 2), lang) : null }}
          onOpened={({ template, channel }) => {
            logContact.mutate({ opportunityId: item.id, type: channel, outcome: 'sent', templateUsed: template });
            update.mutate({ id: item.id, status: 'contacted' });
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Order detail (gap checklist, Orders): where the order is, how long it has taken
 * against the 10–12 business days, and the one or two things to do next. Every
 * move is a Foundry transition or an order note, so the timeline stays the record.
 */
import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Square } from 'lucide-react-native';
import { Badge, Button, KeyValue, Section, Sheet, TextField, formatDate, kitColors, type BadgeTone } from '@/src/ui/kit';
import { toast } from '@/src/ui/useToastStore';
import { useLangStore } from '@/src/i18n';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { useClient } from '@/src/api/useClients';
import { formatMoney, stageLabel, toOrderItem, type OrderItem } from '@/src/api/ordersMapping';

/** "Stale: 1+ days in optician_review" → "Stale: 1+ days in Pending approval". */
const humanizeStates = (text: string, lang: 'en' | 'fr') =>
  text.replace(/\b(awaiting_rx|rx_submitted|optician_review|ready_for_lab|at_lab|received_from_lab|ready_for_pickup|ready_to_ship)\b/g, (st) => stageForState(st, lang));

const stageForState = (state: string, lang: 'en' | 'fr') => stageLabel(toOrderItem({ id: '', state, createdAt: new Date().toISOString() }).stage, lang);
import { collapseEvents, useAddOrderNote, useOrderTimeline, useRequestApproval, useTransitionOrder } from '@/src/api/useOrderDetail';
import { RxCaptureSheet } from '@/src/features/rx/RxCaptureSheet';
import { MessageSheet } from '@/src/features/messages/MessageSheet';
import type { TemplateKey } from '@/src/features/messages/templates';
import { RECEIVING_CHECKS, orderActions, receivingOutcome, type OrderAction, type ReceivingKey } from './orderActions';
import { RX_REMINDER_DAY } from './leadTime';

const LATE_TONE: Record<'on_time' | 'running_late' | 'late', BadgeTone> = { on_time: 'neutral', running_late: 'warning', late: 'danger' };

type Panel = null | 'rx' | 'message' | 'receiving' | 'credential' | 'delay' | 'note';

const EVENT_LABEL: Record<string, { en: string; fr: string }> = {
  state_change: { en: 'Moved', fr: 'Étape' },
  note: { en: 'Note', fr: 'Note' },
  file_upload: { en: 'File added', fr: 'Fichier ajouté' },
  reminder_sent: { en: 'Reminder', fr: 'Rappel' },
  anomaly_flagged: { en: 'Flagged', fr: 'Signalé' },
  upload_requested: { en: 'Upload requested', fr: 'Envoi demandé' },
  approval_submitted: { en: 'Approval requested', fr: 'Approbation demandée' },
};

export function OrderDetailSheet({ order, onClose }: { order: OrderItem; onClose: () => void }) {
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const router = useRouter();
  const { hasAny } = usePermissions();
  const canWrite = hasAny('org:rx:write', 'org:rx-pipeline:write');
  const canVerify = hasAny('org:rx:verify', 'org:rx:sign_off');
  const actions = orderActions(order.state, { canWrite, canVerify });
  const { data: client } = useClient(order.clientId ?? '');
  const { data: timeline } = useOrderTimeline(order.id);
  const transition = useTransitionOrder();
  const addNote = useAddOrderNote();
  const requestApproval = useRequestApproval();

  const [panel, setPanel] = useState<Panel>(null);
  const [messageTemplates, setMessageTemplates] = useState<TemplateKey[]>(['ready_for_pickup']);
  const [failed, setFailed] = useState<ReceivingKey[]>([]);
  const [credential, setCredential] = useState('');
  const [text, setText] = useState('');

  const busy = transition.isPending || addNote.isPending || requestApproval.isPending;
  const msg = (keys: TemplateKey[]) => { setMessageTemplates(keys); setPanel('message'); };

  const move = async (toState: string, note?: string, cred?: string): Promise<boolean> => {
    try {
      await transition.mutateAsync({ id: order.id, toState, note, credential: cred });
      return true;
    } catch (e) {
      toast.error(fr ? 'Étape non changée' : 'Couldn’t move the order', e instanceof Error ? e.message : undefined);
      return false;
    }
  };
  const note = async (n: string) => {
    try { await addNote.mutateAsync({ id: order.id, note: n }); return true; } catch {
      toast.error(fr ? 'Note non enregistrée' : 'Couldn’t save the note'); return false;
    }
  };

  const run = async (a: OrderAction) => {
    switch (a) {
      case 'add_rx': setPanel('rx'); break;
      case 'remind_rx': msg(['rx_reminder']); break;
      case 'request_approval':
        try {
          await requestApproval.mutateAsync({ id: order.id, state: order.state });
          toast.success(fr ? 'Approbation demandée' : 'Approval requested', fr ? 'L’opticien la voit dans Approbations.' : 'The optician sees it in Approvals.');
        } catch (e) {
          toast.error(fr ? 'Demande non envoyée' : 'Couldn’t request approval', e instanceof Error ? e.message : undefined);
        }
        break;
      case 'open_approval': onClose(); router.push('/review'); break;
      case 'send_to_lab': setPanel('credential'); break;
      case 'lab_confirmed':
        if (await note(fr ? 'Labo : commande confirmée' : 'Lab confirmed the job')) {
          toast.success(fr ? 'Confirmation notée' : 'Lab confirmation noted');
          msg(['production_update']);
        }
        break;
      case 'arrived':
        if (await move('received_from_lab', fr ? 'Boîte reçue du labo' : 'Box received from the lab')) setPanel('receiving');
        break;
      case 'receiving_check': setFailed([]); setPanel('receiving'); break;
      case 'message_ready': msg(['ready_for_pickup']); break;
      case 'picked_up':
        if (await move('picked_up', fr ? 'Récupérée par le client' : 'Picked up by the client')) { toast.success(fr ? 'Commande remise' : 'Order handed over'); onClose(); }
        break;
      case 'mark_delayed': setText(''); setPanel('delay'); break;
      case 'add_note': setText(''); setPanel('note'); break;
    }
  };

  const finishReceiving = async () => {
    const outcome = receivingOutcome(failed);
    const failedLabels = failed.map((k) => RECEIVING_CHECKS.find((c) => c.key === k)!.label[lang]).join(', ');
    if (outcome === 'ready') {
      if (await move('ready_for_pickup', fr ? 'Vérification à la réception : tout est conforme' : 'Receiving check passed')) {
        setPanel(null); msg(['ready_for_pickup']);
      }
    } else if (outcome === 'missing_items') {
      if (await note(`${fr ? 'Manquant dans la boîte' : 'Missing from the box'}: ${failedLabels}`)) {
        toast.info(fr ? 'Manquant noté' : 'Missing items noted', fr ? 'Les lunettes restent à vérifier.' : 'The order stays at “Arrived, to check”.');
        setPanel(null);
      }
    } else if (await move('at_lab', `${fr ? 'Ne respecte pas nos standards, à refaire' : 'Failed our check, sent back to redo'}: ${failedLabels}`)) {
      setPanel(null); msg(['job_redo']);
    }
  };

  const actionLabel: Record<OrderAction, string> = {
    add_rx: fr ? 'Ajouter l’ordonnance (photo ou fichier)' : 'Upload or take a photo of the Rx',
    remind_rx: fr ? 'Envoyer un rappel' : 'Send a reminder',
    request_approval: fr ? 'Demander l’approbation' : 'Request approval',
    open_approval: fr ? 'Ouvrir dans Approbations' : 'Open in Approvals',
    send_to_lab: fr ? 'Envoyée au labo' : 'Sent to the lab',
    lab_confirmed: fr ? 'Labo a confirmé' : 'Lab confirmed',
    arrived: fr ? 'Reçue du labo' : 'Arrived from the lab',
    receiving_check: fr ? 'Vérifier la boîte' : 'Check the box',
    message_ready: fr ? 'Prévenir le client' : 'Tell the client it’s ready',
    picked_up: fr ? 'Remise au client' : 'Picked up',
    mark_delayed: fr ? 'Retard' : 'Delayed',
    add_note: fr ? 'Note' : 'Note',
  };
  const primary = actions.find((a) => !['mark_delayed', 'add_note', 'remind_rx'].includes(a))
    ?? (order.stage === 'awaiting_rx' && order.daysInStage >= RX_REMINDER_DAY ? 'remind_rx' : null);
  const secondary = actions.filter((a) => a !== primary);

  const events = useMemo(() => collapseEvents(timeline ?? []).slice(0, 12), [timeline]);
  const recipient = { firstName: client?.firstName, phone: client?.phone, email: client?.email };

  return (
    <>
      <Sheet
        visible={panel === null}
        onClose={onClose}
        wide
        title={order.clientName}
        subtitle={`${order.description} · ${stageLabel(order.stage, lang)}`}
        secondary={{ label: fr ? 'Fermer' : 'Close', onPress: onClose }}
        primary={primary ? { label: actionLabel[primary], onPress: () => run(primary), loading: busy } : undefined}
      >
        <View className="gap-[20px]">
          <View className="flex-row flex-wrap gap-[8px]">
            {order.lateness ? (
              <Badge tone={LATE_TONE[order.lateness]} dot>
                {order.lateness === 'on_time'
                  ? (fr ? `${order.businessDays} j ouvrables sur 12` : `${order.businessDays} of 12 business days`)
                  : (fr ? `En retard · ${order.businessDays} j ouvrables` : `${order.lateness === 'late' ? 'Late' : 'Running late'} · ${order.businessDays} business days`)}
              </Badge>
            ) : null}
            {order.stage === 'awaiting_rx' ? (
              <Badge tone={order.daysInStage >= RX_REMINDER_DAY ? 'warning' : 'neutral'} dot>
                {fr ? `Payé il y a ${order.daysInStage} j, sans ordonnance` : `Paid ${order.daysInStage} days ago, no Rx yet`}
              </Badge>
            ) : null}
          </View>

          <Section padded>
            <KeyValue rows={[
              { label: fr ? 'Article' : 'Item', value: order.description },
              { label: fr ? 'Acheté le' : 'Purchased', value: formatDate(order.purchasedAt) },
              { label: fr ? 'Pris par' : 'Taken by', value: order.staffName },
              { label: fr ? 'Prévu' : 'Expected', value: order.estimatedReady ? formatDate(order.estimatedReady) : null },
              { label: fr ? 'Payé' : 'Paid', value: order.totalCents ? `${formatMoney(order.depositCents)} / ${formatMoney(order.totalCents)}` : null },
              { label: fr ? 'Solde' : 'Balance', value: order.balanceCents ? formatMoney(order.balanceCents) : null },
            ]} />
          </Section>

          {secondary.length ? (
            <View className="flex-row flex-wrap gap-[8px]">
              {secondary.map((a) => <Button key={a} label={actionLabel[a]} size="sm" onPress={() => run(a)} disabled={busy} />)}
              {order.clientId ? <Button label={fr ? 'Dossier client' : 'Client file'} size="sm" variant="ghost" onPress={() => { onClose(); router.push(`/clients/${order.clientId}`); }} /> : null}
            </View>
          ) : null}

          <Section title={fr ? 'Historique' : 'Timeline'} padded={events.length === 0}>
            {events.length === 0 ? <Text className="text-body-sm text-text-tertiary">{fr ? 'Rien encore.' : 'Nothing yet.'}</Text> : events.map((e, i) => (
              <View key={e.id} className={`px-[16px] py-[10px] ${i ? 'border-t border-border' : ''}`}>
                <View className="flex-row items-center justify-between gap-[12px]">
                  <Text className="text-body-md text-text-primary flex-1" numberOfLines={2}>
                    {e.eventType === 'state_change' && e.toState
                      ? `${EVENT_LABEL.state_change![lang]}: ${stageForState(e.toState, lang)}`
                      : `${EVENT_LABEL[e.eventType]?.[lang] ?? e.eventType}${e.text ? `: ${humanizeStates(e.text, lang)}` : ''}`}
                    {e.count > 1 ? <Text className="text-text-tertiary">{`  ×${e.count}`}</Text> : null}
                  </Text>
                  <Text className="text-body-sm text-text-tertiary">{formatDate(e.createdAt)}</Text>
                </View>
                {e.eventType === 'state_change' && e.text ? <Text className="text-body-sm text-text-tertiary mt-[2px]">{e.text}</Text> : null}
              </View>
            ))}
          </Section>
        </View>
      </Sheet>

      {/* Receiving check */}
      <Sheet
        visible={panel === 'receiving'}
        onClose={() => setPanel(null)}
        wide
        title={fr ? 'Vérification à la réception' : 'Receiving check'}
        subtitle={fr ? 'Touchez ce qui ne va pas. Rien de coché = tout est conforme.' : 'Tap anything that’s wrong. Nothing ticked means it all checks out.'}
        secondary={{ label: fr ? 'Plus tard' : 'Later', onPress: () => setPanel(null) }}
        primary={{
          label: receivingOutcome(failed) === 'ready' ? (fr ? 'Tout est conforme' : 'All good, ready for pickup')
            : receivingOutcome(failed) === 'missing_items' ? (fr ? 'Noter le manquant' : 'Note what’s missing')
            : (fr ? 'Renvoyer à refaire' : 'Send back to redo'),
          onPress: finishReceiving,
          loading: busy,
        }}
      >
        <View className="border border-border rounded-lg">
          {RECEIVING_CHECKS.map((c, i) => {
            const bad = failed.includes(c.key);
            return (
              <Pressable key={c.key} onPress={() => setFailed((f) => (bad ? f.filter((k) => k !== c.key) : [...f, c.key]))}
                accessibilityRole="checkbox" accessibilityState={{ checked: bad }}
                className={`flex-row items-center gap-[12px] px-[16px] min-h-[56px] ${i ? 'border-t border-border' : ''}`}>
                {bad ? <Check size={20} color={kitColors.danger} /> : <Square size={20} color={kitColors.iconMuted} />}
                <Text className={`flex-1 text-body-md ${bad ? 'text-error' : 'text-text-primary'}`}>{c.label[lang]}</Text>
                {bad ? <Badge tone="danger">{fr ? 'Problème' : 'Problem'}</Badge> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      {/* Optician credential to release to the lab (OOAQ reserved act) */}
      <Sheet
        visible={panel === 'credential'}
        onClose={() => setPanel(null)}
        title={fr ? 'Envoyer au labo' : 'Send to the lab'}
        subtitle={fr ? 'Acte réservé : entrez votre numéro de permis.' : 'Reserved act: enter your licence number.'}
        secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: () => setPanel(null) }}
        primary={{
          label: fr ? 'Confirmer l’envoi' : 'Confirm sent to lab', loading: busy, disabled: !credential.trim(),
          onPress: async () => { if (await move('at_lab', fr ? 'Envoyée au labo' : 'Sent to the lab', credential.trim())) { setPanel(null); setCredential(''); } },
        }}
      >
        <TextField label={fr ? 'Permis OOAQ' : 'OOAQ licence'} value={credential} onChangeText={setCredential} autoCapitalize="characters" autoCorrect={false} />
      </Sheet>

      {/* Delayed / note */}
      <Sheet
        visible={panel === 'delay' || panel === 'note'}
        onClose={() => setPanel(null)}
        title={panel === 'delay' ? (fr ? 'Commande en retard' : 'Order delayed') : (fr ? 'Note' : 'Note')}
        subtitle={panel === 'delay' ? (fr ? 'Pourquoi, et la nouvelle date si vous l’avez. Le client peut être prévenu ensuite.' : 'Why, and the new date if you have it. You can tell the client next.') : undefined}
        secondary={{ label: fr ? 'Annuler' : 'Cancel', onPress: () => setPanel(null) }}
        primary={{
          label: fr ? 'Enregistrer' : 'Save', loading: busy, disabled: !text.trim(),
          onPress: async () => {
            const delayed = panel === 'delay';
            if (await note(delayed ? `${fr ? 'Retard' : 'Delayed'}: ${text.trim()}` : text.trim())) {
              setPanel(null);
              if (delayed) msg(['job_redo']);
            }
          },
        }}
      >
        <TextField label={panel === 'delay' ? (fr ? 'Raison' : 'Reason') : (fr ? 'Note' : 'Note')} value={text} onChangeText={setText} multiline />
      </Sheet>

      {panel === 'rx' && order.clientId ? (
        <RxCaptureSheet visible customerId={order.clientId} rxOrderId={order.id} onClose={() => setPanel(null)} />
      ) : null}
      {panel === 'message' ? (
        <MessageSheet
          visible
          onClose={() => setPanel(null)}
          recipient={recipient}
          templates={messageTemplates}
          vars={{ frames: order.description, date: order.estimatedReady ? formatDate(order.estimatedReady) : null }}
          onOpened={({ template }) => { void note(`${fr ? 'Message envoyé' : 'Message sent'}: ${template.replace(/_/g, ' ')}`); }}
        />
      ) : null}
    </>
  );
}

import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Bell, Check, Pencil, Play, UserCheck } from 'lucide-react-native';
import type { Appointment } from '@/src/api/appointments.types';
import {
  useAppointmentHolds, useCompleteAppointment, useCancelAppointment, useConfirmAppointment, useSendReminder, useClientAppointments,
} from '@/src/api/useAppointments';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { toast } from '@/src/ui/useToastStore';
import { Badge, Button, KeyValue, Section, type BadgeTone } from '@/src/ui/kit';
import { useVisitActions } from './useVisitActions';

export const APPOINTMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'Scheduled', tone: 'outline' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'warning' },
  in_progress: { label: 'In visit', tone: 'success' },
  completed: { label: 'Done', tone: 'neutral' },
  no_show: { label: 'No-show', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
const dayTime = (iso: string) => new Date(iso).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

interface AppointmentDetailPanelProps {
  appointment: Appointment;
  onEdit: () => void;
  onCancelled?: () => void;
  onBookFollowUp?: () => void;
}

/** Inspector for one appointment: what, who, when, and the next action. */
export function AppointmentDetailPanel({ appointment: a, onEdit, onCancelled, onBookFollowUp }: AppointmentDetailPanelProps) {
  const router = useRouter();
  const staffView = usePrivacyStore((s) => s.mode) === 'staff';
  const { data: holds } = useAppointmentHolds(a.id, a.clientId);
  const { data: history } = useClientAppointments(a.clientId);
  const { arrive, noShow, startVisit } = useVisitActions();
  const complete = useCompleteAppointment();
  const cancel = useCancelAppointment();
  const confirm = useConfirmAppointment();
  const remind = useSendReminder();
  const [armed, setArmed] = useState<'cancel' | 'no_show' | null>(null);

  useEffect(() => setArmed(null), [a.id]);

  const status = APPOINTMENT_STATUS[a.status] ?? APPOINTMENT_STATUS.scheduled!;
  const open = a.status === 'scheduled' || a.status === 'confirmed';
  const terminal = a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled';
  const future = Date.parse(a.startsAt) > Date.now();
  const others = (history ?? []).filter((h) => h.id !== a.id).slice(0, 5);

  const run = (p: Promise<unknown>, ok: string, what: string) =>
    p.then(() => toast.success(ok)).catch(() => toast.error(`Couldn’t ${what}`, 'Check the connection and try again.'));

  const primary = open
    ? { label: 'Mark arrived', icon: UserCheck, onPress: () => arrive(a) }
    : a.status === 'arrived'
      ? { label: 'Start visit', icon: Play, onPress: () => startVisit(a) }
      : a.status === 'in_progress'
        ? { label: 'Open visit', icon: Play, onPress: () => startVisit(a) }
        : null;

  const twoTap = (kind: 'cancel' | 'no_show', act: () => void) => () => (armed === kind ? (setArmed(null), act()) : setArmed(kind));

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32, paddingBottom: 140, gap: 20 }} showsVerticalScrollIndicator={false}>
      <View className="gap-[6px]">
        <View className="flex-row items-center gap-[10px]">
          <Badge tone={status.tone} dot>{status.label}</Badge>
          <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
            {time(a.startsAt)}–{time(a.endsAt)}{future && !sameDay(a.startsAt) ? ` · ${new Date(a.startsAt).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}` : ''}
          </Text>
        </View>
        <Pressable onPress={() => a.clientId && router.push(`/clients/${a.clientId}`)} disabled={!a.clientId} accessibilityRole="link">
          <Text className="text-display-lg text-text-primary" numberOfLines={1}>{a.clientName ?? 'No client yet'}</Text>
        </Pressable>
        <Text className="text-body-lg text-text-secondary">{a.type}{a.duration ? ` · ${a.duration} min` : ''}</Text>
      </View>

      {staffView && !terminal ? (
        <View className="flex-row flex-wrap items-center gap-[8px]">
          {primary ? <Button label={primary.label} icon={primary.icon} variant="primary" onPress={primary.onPress} /> : null}
          {a.status === 'arrived' || a.status === 'in_progress' ? (
            <Button label="Mark done" icon={Check} onPress={() => run(complete.mutateAsync(a.id), 'Appointment done', 'mark it done')} disabled={complete.isPending} />
          ) : null}
          {a.status === 'scheduled' ? (
            <Button label="Confirm" icon={Check} onPress={() => run(confirm.mutateAsync(a.id), 'Confirmed', 'confirm')} disabled={confirm.isPending} />
          ) : null}
          {open && future && !a.reminderSentAt ? (
            <Button label="Send reminder" icon={Bell} variant="ghost" onPress={() => run(remind.mutateAsync(a.id), 'Reminder sent', 'send the reminder')} loading={remind.isPending} />
          ) : null}
          <Button label="Edit" icon={Pencil} variant="ghost" onPress={onEdit} />
        </View>
      ) : null}
      {staffView && a.status === 'completed' && a.clientId && onBookFollowUp ? (
        <View className="flex-row"><Button label="Book follow-up" onPress={onBookFollowUp} /></View>
      ) : null}

      <Section title="Details">
        <KeyValue
          rows={[
            { label: 'When', value: dayTime(a.startsAt) },
            { label: 'With', value: a.staffName },
            { label: 'Reminder', value: a.reminderSentAt ? `Sent ${dayTime(a.reminderSentAt)}${a.reminderPreference ? ` by ${a.reminderPreference}` : ''}` : null },
          ]}
        />
      </Section>

      {staffView && a.notes ? (
        <Section title="Notes"><Text className="text-body-md text-text-primary">{a.notes}</Text></Section>
      ) : null}

      {staffView && holds && holds.length ? (
        <Section title="Frames held" count={holds.length} padded={false}>
          {holds.map((h, i) => (
            <View key={h.id} className={`flex-row items-center justify-between px-[20px] min-h-[52px] ${i ? 'border-t border-border' : ''}`}>
              <View className="flex-1">
                <Text className="text-body-md text-text-primary" numberOfLines={1}>{h.productName}</Text>
                {h.variantTitle ? <Text className="text-body-sm text-text-tertiary">{h.variantTitle}</Text> : null}
              </View>
              <Text className="text-body-sm text-text-tertiary">until {new Date(h.expiresAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {staffView && others.length ? (
        <Section title="Their other visits" padded={false} action={a.clientId ? { label: 'Profile', onPress: () => router.push(`/clients/${a.clientId}`) } : undefined}>
          {others.map((h, i) => {
            const s = APPOINTMENT_STATUS[h.status] ?? APPOINTMENT_STATUS.scheduled!;
            return (
              <View key={h.id} className={`flex-row items-center gap-[12px] px-[20px] min-h-[52px] ${i ? 'border-t border-border' : ''}`}>
                <Text className="w-[140px] text-body-sm text-text-tertiary">{new Date(h.startsAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                <Text className="flex-1 text-body-md text-text-primary" numberOfLines={1}>{h.type}</Text>
                <Badge tone={s.tone}>{s.label}</Badge>
              </View>
            );
          })}
        </Section>
      ) : null}

      {staffView && open ? (
        <View className="flex-row flex-wrap gap-[8px] pt-[4px]">
          <Button
            label={armed === 'no_show' ? 'Tap again: no-show' : 'Mark no-show'}
            variant="danger"
            size="sm"
            onPress={twoTap('no_show', () => noShow(a))}
          />
          <Button
            label={armed === 'cancel' ? 'Tap again to cancel' : 'Cancel appointment'}
            variant="danger"
            size="sm"
            onPress={twoTap('cancel', () => run(cancel.mutateAsync(a.id).then(() => onCancelled?.()), 'Appointment cancelled', 'cancel'))}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function sameDay(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

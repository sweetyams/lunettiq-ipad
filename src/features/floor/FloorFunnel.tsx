/**
 * Floor as a funnel (gap checklist, Home): four big starts (start a visit, find a
 * client, open a profile, new client), today's status (late orders first), and the
 * store traffic counter. Every tile is one tap to the work.
 */
import { useMemo, useState, type ComponentType } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { DoorOpen, Search, UserRound, UserPlus, Minus, Plus, type LucideProps } from 'lucide-react-native';
import { Badge, ListRow, Section, Sheet, StatusDot, elevation, kitColors, type StatusDotTone } from '@/src/ui/kit';
import { Avatar } from '@/src/ui/Avatar';
import { useT } from '@/src/i18n';
import { useOrders } from '@/src/api/useRxPipeline';
import { lateOrders } from '@/src/api/ordersMapping';
import { useFollowUps } from '@/src/api/useHotLeads';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { useRecentClients } from '@/src/api/useClients';
import { useTodayAppointments } from '@/src/api/useAppointments';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useQuickClient } from '@/src/features/clients/useQuickClient';
import { WalkInSheet } from '@/src/features/appointments/WalkInButton';
import { useEffectiveLocationId } from '@/src/features/tenant/useDeviceLocationStore';
import { RX_REMINDER_DAY } from '@/src/features/orders/leadTime';
import { useWalkInCounter, dayKey } from './useWalkInCounter';

function Tile({ icon: Icon, title, hint, primary, onPress }: { icon: ComponentType<LucideProps>; title: string; hint: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${hint}`} className="flex-1 min-w-[200px]" style={{ alignSelf: 'stretch' }}>
      {({ pressed }) => (
        <View
          className={`flex-1 rounded-lg p-[20px] min-h-[148px] justify-between border ${primary ? 'bg-accent border-accent' : 'bg-bg-surface border-border'} ${pressed ? 'opacity-80' : ''}`}
          style={primary ? undefined : elevation.raised}
        >
          <View className={`w-[44px] h-[44px] rounded-md items-center justify-center ${primary ? 'border border-text-inverse' : 'border border-border'}`}>
            <Icon size={22} color={primary ? kitColors.inverse : kitColors.icon} />
          </View>
          <View className="gap-[2px] mt-[16px]">
            <Text className={`text-heading-lg ${primary ? 'text-accent-text' : 'text-text-primary'}`}>{title}</Text>
            <Text className={`text-body-sm ${primary ? 'text-accent-text opacity-80' : 'text-text-tertiary'}`}>{hint}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Today's and recent clients, one tap to their profile. */
function OpenProfileSheet({ onClose }: { onClose: () => void }) {
  const tr = useT();
  const router = useRouter();
  const { data: appts } = useTodayAppointments();
  const { data: recent } = useRecentClients();
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<{ id: string; name: string; detail: string }> = [];
    for (const a of appts ?? []) {
      if (!a.clientId || seen.has(a.clientId)) continue;
      seen.add(a.clientId);
      out.push({ id: a.clientId, name: a.clientName ?? tr('floor.client'), detail: `${new Date(a.startsAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })} · ${a.type}` });
    }
    for (const c of recent?.clients ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({ id: c.id, name: [c.firstName, c.lastName].filter(Boolean).join(' ') || tr('floor.client'), detail: tr('floor.recentClients') });
    }
    return out;
  }, [appts, recent, tr]);
  return (
    <Sheet visible onClose={onClose} title={tr('floor.openAProfile')} subtitle={tr('floor.openAProfileHint')}>
      <View className="border border-border rounded-lg">
        {rows.length === 0 ? <Text className="p-[16px] text-body-sm text-text-tertiary">{tr('floor.noRecent')}</Text> : rows.map((r, i) => {
          const [f, ...l] = r.name.split(' ');
          return (
            <ListRow key={r.id} divider={i > 0} chevron
              leading={<Avatar firstName={f ?? ''} lastName={l.join(' ')} size="sm" />}
              title={r.name} subtitle={r.detail}
              onPress={() => { onClose(); router.push(`/clients/${r.id}`); }} />
          );
        })}
      </View>
    </Sheet>
  );
}

export function FunnelTiles() {
  const tr = useT();
  const router = useRouter();
  const showQuickClient = useQuickClient((s) => s.show);
  const [walkIn, setWalkIn] = useState(false);
  const [profiles, setProfiles] = useState(false);
  return (
    <>
      <View className="flex-row flex-wrap items-stretch gap-[16px]">
        <Tile primary icon={DoorOpen} title={tr('floor.startVisit')} hint={tr('floor.startVisitHint')} onPress={() => setWalkIn(true)} />
        <Tile icon={Search} title={tr('floor.findClient2')} hint={tr('floor.findClientHint')} onPress={() => router.push('/clients')} />
        <Tile icon={UserRound} title={tr('floor.openAProfile')} hint={tr('floor.openAProfileHint')} onPress={() => setProfiles(true)} />
        <Tile icon={UserPlus} title={tr('floor.newClient')} hint={tr('floor.newClientHint')} onPress={() => showQuickClient()} />
      </View>
      <WalkInSheet visible={walkIn} onClose={() => setWalkIn(false)} />
      {profiles ? <OpenProfileSheet onClose={() => setProfiles(false)} /> : null}
    </>
  );
}

/** The daily status view: late orders first, then what needs a hand today. */
export function TodayStatus() {
  const tr = useT();
  const router = useRouter();
  const privacy = usePrivacyStore((s) => s.mode);
  const { data: orders } = useOrders();
  const { data: followUps } = useFollowUps();
  const { data: approvals } = useRxApprovalSummary();
  const { hasAny } = usePermissions();
  const canReview = hasAny('org:rx:verify', 'org:rx:sign_off');
  const open = useMemo(() => (orders ?? []).filter((o) => o.stage !== 'done'), [orders]);
  const late = useMemo(() => lateOrders(open), [open]);
  if (privacy === 'client') return null;

  const waiting = open.filter((o) => o.stage === 'awaiting_rx');
  const toRemind = waiting.filter((o) => o.daysInStage >= RX_REMINDER_DAY).length;
  const pickups = open.filter((o) => o.stage === 'ready_for_pickup').length;
  const calls = (followUps ?? []).filter((f) => f.due === 'call_now' || f.due === 'last_chance').length;

  const rows: Array<{ key: string; tone: StatusDotTone; label: string; detail?: string; count: number; route: string }> = [
    { key: 'late', tone: late.length ? 'danger' : 'success', label: late.length ? tr('floor.late') : tr('floor.lateNone'), detail: late.slice(0, 3).map((o) => o.clientName).join(', ') || undefined, count: late.length, route: '/orders' },
    { key: 'pickup', tone: 'success', label: tr('floor.pickups'), count: pickups, route: '/orders' },
    { key: 'rx', tone: toRemind ? 'warning' : 'muted', label: tr('floor.waitingRx'), detail: toRemind ? tr('floor.remindDue', { count: toRemind }) : undefined, count: waiting.length, route: '/orders' },
    { key: 'calls', tone: calls ? 'warning' : 'muted', label: tr('floor.followUps'), count: calls, route: '/follow-ups' },
  ];
  if (canReview) rows.push({ key: 'approvals', tone: 'info', label: tr('floor.approvals'), count: approvals?.submitted ?? 0, route: '/review' });

  return (
    <Section title={tr('floor.status')} padded={false}>
      {rows.map((r, i) => (
        <ListRow
          key={r.key}
          divider={i > 0}
          chevron
          leading={<StatusDot tone={r.tone} />}
          title={r.label}
          subtitle={r.detail}
          trailing={r.key === 'late' && !r.count ? null : <Badge tone={r.key === 'late' && r.count ? 'danger' : 'outline'}>{String(r.count)}</Badge>}
          onPress={() => router.push(r.route as never)}
        />
      ))}
    </Section>
  );
}

/** Store traffic: one big tap per person in; helped comes from visits started. */
export function TrafficCounter() {
  const tr = useT();
  const location = useEffectiveLocationId();
  const key = dayKey(location);
  const day = useWalkInCounter((s) => s.days[key]);
  const { tapIn, undo } = useWalkInCounter();
  const privacy = usePrivacyStore((s) => s.mode);
  if (privacy === 'client') return null;
  const cameIn = day?.cameIn ?? 0;
  const helped = day?.helped ?? 0;
  return (
    <Section title={tr('floor.traffic')}>
      <View className="flex-row items-center gap-[16px]">
        <Pressable onPress={() => tapIn(key)} accessibilityRole="button" accessibilityLabel={`${tr('floor.tapIn')}. ${tr('floor.cameIn')} ${cameIn}`}
          className="flex-1 flex-row items-center gap-[12px] rounded-lg border border-border px-[16px] min-h-[64px] active:bg-bg-subtle">
          <View className="w-[40px] h-[40px] rounded-full bg-accent items-center justify-center"><Plus size={22} color={kitColors.inverse} /></View>
          <View>
            <Text className="text-display-sm text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{cameIn}</Text>
            <Text className="text-body-sm text-text-tertiary">{tr('floor.cameIn')}</Text>
          </View>
        </Pressable>
        <View className="items-center min-w-[72px]">
          <Text className="text-display-sm text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{helped}</Text>
          <Text className="text-body-sm text-text-tertiary">{tr('floor.helped')}</Text>
        </View>
        <Pressable onPress={() => undo(key)} disabled={!cameIn} accessibilityRole="button" accessibilityLabel={tr('floor.undo')} hitSlop={8}
          className={`w-[44px] h-[44px] rounded-full border border-border items-center justify-center ${cameIn ? '' : 'opacity-40'}`}>
          <Minus size={18} color={kitColors.icon} />
        </Pressable>
      </View>
      <Text className="text-body-sm text-text-tertiary mt-[10px]">{tr('floor.trafficHint')}</Text>
    </Section>
  );
}

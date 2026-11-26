import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveHolds } from '@/src/api/useAppointments';
import { useRxPipelineCounts } from '@/src/api/useRxPipeline';
import { useRxApprovalSummary } from '@/src/api/useRxApprovals';
import { useRecentClients } from '@/src/api/useClients';
import { usePermissions } from '@/src/features/auth/usePermissions';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar } from '@/src/ui/Avatar';
import { Badge, ListRow, Section, StatusDot, kitColors } from '@/src/ui/kit';
import { useT } from '@/src/i18n';

function relativeDay(iso: string, tr: ReturnType<typeof useT>): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return tr('floor.today');
  if (days === 1) return tr('floor.yesterday');
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function timeLeft(iso: string): { label: string; urgent: boolean } {
  const hours = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
  if (hours < 24) return { label: `${hours}h left`, urgent: true };
  return { label: `${Math.floor(hours / 24)}d left`, urgent: false };
}

function Loading() {
  return <View className="py-[20px] items-center"><ActivityIndicator color={kitColors.iconMuted} /></View>;
}

function Quiet({ children }: { children: string }) {
  return <Text className="text-body-sm text-text-tertiary px-[20px] pb-[20px]">{children}</Text>;
}

/** Holds placed during visits; staff-only (hidden in client view). */
export function HoldsSection() {
  const tr = useT();
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: holds, isLoading } = useActiveHolds();
  if (privacyMode === 'client') return null;
  const list = holds ?? [];
  return (
    <Section title={tr('floor.holds')} count={list.length} padded={false}>
      {isLoading ? <Loading /> : list.length === 0 ? <Quiet>{tr('floor.noHolds')}</Quiet> : list.map((h, i) => {
        const left = h.expiresAt ? timeLeft(h.expiresAt) : null;
        return (
          <ListRow
            key={h.id}
            title={h.productName}
            divider={i > 0}
            onPress={h.clientId ? () => router.push(`/clients/${h.clientId}`) : undefined}
            trailing={left ? <Badge tone={left.urgent ? 'warning' : 'neutral'}>{left.label}</Badge> : null}
          />
        );
      })}
    </Section>
  );
}

/** Rx orders and optician review at a glance; each row opens its tab. */
export function RxSection() {
  const tr = useT();
  const router = useRouter();
  const { data: counts } = useRxPipelineCounts();
  const { data: approvals } = useRxApprovalSummary();
  const { hasAny } = usePermissions();
  const canReview = hasAny('org:rx:verify', 'org:rx:sign_off');
  const rows: Array<{ key: string; tone: 'success' | 'warning' | 'info' | 'muted'; label: string; route: string }> = [
    { key: 'ready', tone: 'success', label: `${counts?.ready ?? 0} ready for pickup`, route: '/orders?filter=ready_for_pickup' },
    { key: 'awaiting', tone: 'warning', label: `${counts?.awaiting_rx ?? 0} awaiting a prescription`, route: '/orders?filter=awaiting_rx' },
    { key: 'progress', tone: 'muted', label: `${(counts?.ordered ?? 0) + (counts?.in_lab ?? 0) + (counts?.quality_check ?? 0)} in progress`, route: '/orders' },
  ];
  if (canReview) rows.push({ key: 'review', tone: 'info', label: `${approvals?.submitted ?? 0} waiting for your review`, route: '/review' });
  return (
    <Section title={tr('floor.orders')} padded={false}>
      {rows.map((r, i) => (
        <ListRow
          key={r.key}
          divider={i > 0}
          leading={<StatusDot tone={r.tone} />}
          title={r.label}
          chevron
          onPress={() => router.push(r.route as never)}
        />
      ))}
    </Section>
  );
}

export function RecentClientsSection() {
  const tr = useT();
  const router = useRouter();
  const { data, isLoading } = useRecentClients();
  const clients = data?.clients ?? [];
  return (
    <Section title={tr('floor.recentClients')} padded={false} action={{ label: tr('floor.allClients'), onPress: () => router.push('/clients') }}>
      {isLoading ? <Loading /> : clients.length === 0 ? <Quiet>{tr('floor.noRecent')}</Quiet> : clients.map((c, i) => (
        <ListRow
          key={c.id}
          divider={i > 0}
          leading={<Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />}
          title={[c.firstName, c.lastName].filter(Boolean).join(' ') || tr('floor.client')}
          trailing={<Text className="text-body-sm text-text-tertiary">{relativeDay(c.updatedAt, tr)}</Text>}
          onPress={() => router.push(`/clients/${c.id}`)}
        />
      ))}
    </Section>
  );
}

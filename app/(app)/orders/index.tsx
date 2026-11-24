import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react-native';
import { useOrders } from '@/src/api/useRxPipeline';
import { ORDER_STAGES, ageLevel, formatMoney, lateOrders, stageLabel, type OrderItem, type OrderStage } from '@/src/api/ordersMapping';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { Badge, Button, FilterChips, PageHeader, elevation, formatDate, type BadgeTone } from '@/src/ui/kit';
import { useLayout } from '@/src/ui/layout';
import { useLangStore } from '@/src/i18n';
import { OrderDetailSheet } from '@/src/features/orders/OrderDetailSheet';
import { RX_REMINDER_DAY } from '@/src/features/orders/leadTime';

/** "Oct 18" this year, "Oct 18, 2025" otherwise: fits the tracker column on one line. */
function shortDate(iso: string, lang: 'en' | 'fr'): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

type Filter = 'active' | 'late' | OrderStage;
type View_ = 'cards' | 'table';

const AGE_TONE: Record<'ok' | 'warn' | 'late', BadgeTone> = { ok: 'neutral', warn: 'warning', late: 'danger' };

/** The badge that matters most for this order: late against lead time, else days in stage. */
function statusBadge(o: OrderItem, fr: boolean): { tone: BadgeTone; label: string } {
  if (o.lateness === 'late') return { tone: 'danger', label: fr ? `En retard · ${o.businessDays} j ouvr.` : `Late · ${o.businessDays} work days` };
  if (o.lateness === 'running_late') return { tone: 'warning', label: fr ? `Retard proche · ${o.businessDays} j ouvr.` : `Running late · ${o.businessDays} work days` };
  if (o.stage === 'awaiting_rx' && o.daysInStage >= RX_REMINDER_DAY) return { tone: 'warning', label: fr ? `Jour ${o.daysInStage} · relancer` : `Day ${o.daysInStage} · remind` };
  return { tone: AGE_TONE[ageLevel(o)], label: fr ? `Jour ${o.daysInStage}` : `Day ${o.daysInStage}` };
}

function OrderCard({ order, onPress, fr, lang }: { order: OrderItem; onPress: () => void; fr: boolean; lang: 'en' | 'fr' }) {
  const pickup = order.stage === 'ready_for_pickup';
  const badge = statusBadge(order, fr);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${order.clientName}, ${stageLabel(order.stage, lang)}, ${badge.label}`} className="flex-1 m-[8px]">
      {({ pressed }) => (
        <View className={`border border-border rounded-lg p-[20px] min-h-[140px] ${pressed ? 'bg-bg-subtle' : 'bg-bg-surface'}`} style={elevation.raised}>
          <View className="flex-row items-center justify-between gap-[12px]">
            <Text className="text-heading-lg text-text-primary flex-1" numberOfLines={1}>{order.clientName}</Text>
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </View>
          <Text className="text-body-md text-text-secondary mt-[4px]" numberOfLines={1}>{order.description}</Text>
          <View className="flex-row items-center justify-between mt-auto pt-[16px]">
            <Text className="text-caption-sm uppercase text-text-tertiary">{stageLabel(order.stage, lang)}</Text>
            {pickup ? (
              <Text className="text-body-md font-medium text-text-primary">
                {order.balanceCents > 0 ? (fr ? `${formatMoney(order.balanceCents)} à percevoir` : `${formatMoney(order.balanceCents)} to collect`) : (fr ? 'Payé' : 'Paid')}
              </Text>
            ) : order.depositCents > 0 ? (
              <Text className="text-body-md text-text-tertiary">
                <Text className="font-medium text-text-primary">{formatMoney(order.depositCents)}</Text> {fr ? 'sur' : 'of'} {formatMoney(order.totalCents)}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** The store's tracker (replaces the Excel sheet): client, item, purchase date, staff, stage. */
function TrackerTable({ rows, onOpen, fr, lang }: { rows: OrderItem[]; onOpen: (o: OrderItem) => void; fr: boolean; lang: 'en' | 'fr' }) {
  const head = 'text-caption-sm uppercase text-text-tertiary';
  return (
    <View className="mx-[32px] mt-[12px] border border-border rounded-lg bg-bg-surface overflow-hidden">
      <View className="flex-row items-center gap-[12px] px-[16px] min-h-[40px] border-b border-border bg-bg-subtle">
        <Text className={`${head} flex-[2]`}>{fr ? 'Client' : 'Client'}</Text>
        <Text className={`${head} flex-[2]`}>{fr ? 'Article' : 'Item'}</Text>
        <Text className={`${head} flex-1`}>{fr ? 'Acheté' : 'Purchased'}</Text>
        <Text className={`${head} flex-1`}>{fr ? 'Employé' : 'Staff'}</Text>
        <Text className={`${head} flex-[2]`}>{fr ? 'Étape' : 'Stage'}</Text>
        <Text className={`${head} w-[150px] text-right`}>{fr ? 'Statut' : 'Status'}</Text>
      </View>
      {rows.map((o, i) => {
        const b = statusBadge(o, fr);
        return (
          <Pressable key={o.id} onPress={() => onOpen(o)} accessibilityRole="button" accessibilityLabel={`${o.clientName}, ${o.description}`}>
            {({ pressed }) => (
              <View className={`flex-row items-center gap-[12px] px-[16px] min-h-[52px] ${i ? 'border-t border-border' : ''} ${pressed ? 'bg-bg-subtle' : ''}`}>
                <Text className="flex-[2] text-body-md font-medium text-text-primary" numberOfLines={1}>{o.clientName}</Text>
                <Text className="flex-[2] text-body-md text-text-secondary" numberOfLines={1}>{o.description}</Text>
                <Text className="flex-1 text-body-md text-text-secondary" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>{shortDate(o.purchasedAt, lang)}</Text>
                <Text className="flex-1 text-body-md text-text-secondary" numberOfLines={1}>{o.staffName ?? '—'}</Text>
                <Text className="flex-[2] text-body-md text-text-secondary" numberOfLines={1}>{stageLabel(o.stage, lang)}</Text>
                <View className="w-[150px] items-end"><Badge tone={b.tone}>{b.label}</Badge></View>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function OrdersContent() {
  const layout = useLayout();
  const lang = useLangStore((s) => s.uiLang);
  const fr = lang === 'fr';
  const { data: orders, isLoading, error, refetch, isRefetching } = useOrders();
  const [filter, setFilter] = useState<Filter>('active');
  const [view, setView] = useState<View_>('cards');
  const [open, setOpen] = useState<OrderItem | null>(null);

  const active = useMemo(() => (orders ?? []).filter((o) => o.stage !== 'done'), [orders]);
  const late = useMemo(() => lateOrders(active), [active]);
  const counts = useMemo(() => {
    const c = {} as Record<OrderStage, number>;
    for (const o of active) c[o.stage] = (c[o.stage] ?? 0) + 1;
    return c;
  }, [active]);
  const depositsHeld = useMemo(() => active.filter((o) => o.stage === 'awaiting_rx').reduce((sum, o) => sum + o.depositCents, 0), [active]);
  const visible = useMemo(() => {
    const list = filter === 'active' ? active : filter === 'late' ? late : active.filter((o) => o.stage === filter);
    // Table reads like the old spreadsheet (newest purchase first); cards put what waited longest first.
    return view === 'table'
      ? list.slice().sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt))
      : filter === 'late' ? list : list.slice().sort((a, b) => b.daysInStage - a.daysInStage);
  }, [active, late, filter, view]);

  const subtitle = fr
    ? `${late.length} en retard · ${counts.awaiting_rx ?? 0} payées sans ordonnance (${formatMoney(depositsHeld)}) · ${counts.ready_for_pickup ?? 0} prêtes`
    : `${late.length} late · ${counts.awaiting_rx ?? 0} paid, waiting for Rx (${formatMoney(depositsHeld)}) · ${counts.ready_for_pickup ?? 0} ready for pickup`;

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={fr ? 'Commandes' : 'Orders'}
        subtitle={subtitle}
        actions={
          <View className="flex-row gap-[8px]">
            <Button label={fr ? 'Cartes' : 'Cards'} icon={LayoutGrid} size="sm" variant={view === 'cards' ? 'primary' : 'secondary'} onPress={() => setView('cards')} />
            <Button label={fr ? 'Suivi' : 'Tracker'} icon={Rows3} size="sm" variant={view === 'table' ? 'primary' : 'secondary'} onPress={() => setView('table')} />
          </View>
        }
      />
      <View className="px-[32px] pt-[20px] pb-[4px]">
        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'active', label: fr ? 'Toutes' : 'All open', count: active.length },
            { key: 'late', label: fr ? 'En retard' : 'Late', count: late.length },
            ...ORDER_STAGES.map((s) => ({ key: s.key as Filter, label: fr ? s.labelFr : s.label, count: counts[s.key] ?? 0 })),
          ]}
        />
      </View>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : visible.length === 0 ? (
        <EmptyState message={filter === 'late' ? (fr ? 'Rien en retard.' : 'Nothing running late.') : filter === 'active' ? (fr ? 'Aucune commande ouverte.' : 'No open orders.') : (fr ? 'Rien à cette étape.' : 'Nothing at this stage.')} />
      ) : view === 'table' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          <TrackerTable rows={visible} onOpen={setOpen} fr={fr} lang={lang} />
        </ScrollView>
      ) : (
        <FlatList
          key={`orders-${layout.twoPane ? 2 : 1}`}
          data={visible}
          keyExtractor={(o) => o.id}
          numColumns={layout.twoPane ? 2 : 1}
          renderItem={({ item }) => <OrderCard order={item} onPress={() => setOpen(item)} fr={fr} lang={lang} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
      {open ? <OrderDetailSheet order={open} onClose={() => setOpen(null)} /> : null}
    </View>
  );
}

export default function OrdersScreen() {
  const fr = useLangStore((s) => s.uiLang) === 'fr';
  return (
    <PermissionGate
      permissions={['org:rx-pipeline:read', 'org:rx:read']}
      fallback={<EmptyState message={fr ? 'Vous n’avez pas accès aux commandes. Demandez à un gestionnaire.' : 'You don’t have access to orders. Ask a manager.'} />}
    >
      <OrdersContent />
    </PermissionGate>
  );
}

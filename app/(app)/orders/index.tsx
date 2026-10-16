import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOrders } from '@/src/api/useRxPipeline';
import { ORDER_STAGES, ageLevel, formatMoney, type OrderItem, type OrderStage } from '@/src/api/ordersMapping';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { Badge, FilterChips, PageHeader, elevation, type BadgeTone } from '@/src/ui/kit';

type Filter = 'active' | OrderStage;

const AGE_TONE: Record<'ok' | 'warn' | 'late', BadgeTone> = { ok: 'neutral', warn: 'warning', late: 'danger' };
const STAGE_LABEL = Object.fromEntries(ORDER_STAGES.map((s) => [s.key, s.label])) as Record<OrderStage, string>;

function OrderCard({ order, onPress }: { order: OrderItem; onPress: () => void }) {
  const pickup = order.stage === 'ready_for_pickup';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${order.clientName}, ${STAGE_LABEL[order.stage] ?? 'Done'}, day ${order.daysInStage}`}
      className="flex-1 m-[8px]"
    >
      {({ pressed }) => (
        <View className={`border border-border rounded-lg p-[20px] min-h-[140px] ${pressed ? 'bg-bg-subtle' : 'bg-bg-surface'}`} style={elevation.raised}>
          <View className="flex-row items-center justify-between gap-[12px]">
            <Text className="text-heading-lg text-text-primary flex-1" numberOfLines={1}>{order.clientName}</Text>
            <Badge tone={AGE_TONE[ageLevel(order)]}>{`Day ${order.daysInStage}`}</Badge>
          </View>
          <Text className="text-body-md text-text-secondary mt-[4px]" numberOfLines={1}>{order.description}</Text>

          <View className="flex-row items-center justify-between mt-auto pt-[16px]">
            <Text className="text-caption-sm uppercase text-text-tertiary">{STAGE_LABEL[order.stage] ?? 'Done'}</Text>
            {pickup ? (
              <Text className="text-body-md font-medium text-text-primary">
                {order.balanceCents > 0 ? `${formatMoney(order.balanceCents)} to collect` : 'Paid'}
              </Text>
            ) : order.depositCents > 0 ? (
              <Text className="text-body-md text-text-tertiary">
                <Text className="font-medium text-text-primary">{formatMoney(order.depositCents)}</Text> of {formatMoney(order.totalCents)}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function OrdersContent() {
  const router = useRouter();
  const { data: orders, isLoading, error, refetch, isRefetching } = useOrders();
  const [filter, setFilter] = useState<Filter>('active');

  const active = useMemo(() => (orders ?? []).filter((o) => o.stage !== 'done'), [orders]);
  const counts = useMemo(() => {
    const c = {} as Record<OrderStage, number>;
    for (const o of active) c[o.stage] = (c[o.stage] ?? 0) + 1;
    return c;
  }, [active]);
  const depositsHeld = useMemo(
    () => active.filter((o) => o.stage === 'awaiting_rx').reduce((sum, o) => sum + o.depositCents, 0),
    [active],
  );
  // Oldest first: what has waited longest needs attention first.
  const visible = useMemo(
    () => (filter === 'active' ? active : active.filter((o) => o.stage === filter)).slice().sort((a, b) => b.daysInStage - a.daysInStage),
    [active, filter],
  );
  const openClient = useCallback((o: OrderItem) => {
    if (o.clientId) router.push(`/clients/${o.clientId}`);
  }, [router]);

  const subtitle = `${counts.awaiting_rx ?? 0} awaiting a prescription · ${formatMoney(depositsHeld)} in deposits held · ${counts.ready_for_pickup ?? 0} ready for pickup`;

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader title="Orders" subtitle={subtitle} />
      <View className="px-[32px] pt-[20px] pb-[4px]">
        <FilterChips<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'active', label: 'All open', count: active.length },
            ...ORDER_STAGES.map((s) => ({ key: s.key as Filter, label: s.label, count: counts[s.key] ?? 0 })),
          ]}
        />
      </View>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : visible.length === 0 ? (
        <EmptyState message={filter === 'active' ? 'No open orders.' : `Nothing in ${STAGE_LABEL[filter as OrderStage]}.`} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          numColumns={2}
          renderItem={({ item }) => <OrderCard order={item} onPress={() => openClient(item)} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}
    </View>
  );
}

export default function OrdersScreen() {
  return (
    <PermissionGate
      permissions={['org:rx-pipeline:read', 'org:rx:read']}
      fallback={<EmptyState message="You don't have access to orders. Ask a manager." />}
    >
      <OrdersContent />
    </PermissionGate>
  );
}

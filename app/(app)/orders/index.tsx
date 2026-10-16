import { View, Text, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useOrders } from '@/src/api/useRxPipeline';
import { ORDER_STAGES, ageLevel, formatMoney, type OrderItem, type OrderStage } from '@/src/api/ordersMapping';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';

type Filter = 'active' | OrderStage;

const AGE_STYLES = {
  ok: { bg: 'bg-bg-muted', fg: 'text-text-secondary' },
  warn: { bg: 'bg-warning-soft', fg: 'text-warning' },
  late: { bg: 'bg-error-soft', fg: 'text-error' },
} as const;

const STAGE_LABEL = Object.fromEntries(ORDER_STAGES.map((s) => [s.key, s.label])) as Record<OrderStage, string>;

function OrderCard({ order, onPress }: { order: OrderItem; onPress: () => void }) {
  const age = AGE_STYLES[ageLevel(order)];
  const pickup = order.stage === 'ready_for_pickup';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${order.clientName}, ${STAGE_LABEL[order.stage] ?? 'Done'}, day ${order.daysInStage}`}
      className="flex-1 bg-bg-surface border border-border rounded-lg p-lg m-xs min-h-[148px]"
    >
      <View className="flex-row items-start justify-between gap-sm">
        <Text className="text-heading-lg text-text-primary flex-1" numberOfLines={1}>{order.clientName}</Text>
        <View className={`rounded-sm px-sm py-[2px] ${age.bg}`}>
          <Text className={`text-body-sm font-medium ${age.fg}`}>Day {order.daysInStage}</Text>
        </View>
      </View>
      <Text className="text-body-md text-text-secondary mt-xs" numberOfLines={1}>{order.description}</Text>

      <View className="flex-row items-end justify-between mt-auto pt-md">
        <Text className="text-body-sm text-text-muted uppercase tracking-wider">{STAGE_LABEL[order.stage] ?? 'Done'}</Text>
        {pickup ? (
          <Text className="text-body-md font-medium text-text-primary">
            {order.balanceCents > 0 ? `Balance ${formatMoney(order.balanceCents)}` : 'Paid'}
          </Text>
        ) : order.depositCents > 0 ? (
          <Text className="text-body-md text-text-secondary">
            <Text className="font-medium text-text-primary">{formatMoney(order.depositCents)}</Text> of {formatMoney(order.totalCents)}
          </Text>
        ) : null}
      </View>
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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const chips: Array<{ key: Filter; label: string; count: number }> = [
    { key: 'active', label: 'All active', count: active.length },
    ...ORDER_STAGES.map((s) => ({ key: s.key as Filter, label: s.label, count: counts[s.key] ?? 0 })),
  ];

  return (
    <View className="flex-1 bg-bg-page">
      <View className="px-xl pt-2xl pb-md border-b border-border">
        <Text className="text-display-lg text-text-primary">Orders</Text>
        <Text className="text-body-md text-text-muted mt-xs">
          {counts.awaiting_rx ?? 0} awaiting Rx · {formatMoney(depositsHeld)} in deposits held · {counts.ready_for_pickup ?? 0} ready for pickup
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-lg" contentContainerStyle={{ gap: 8 }}>
          {chips.map((c) => {
            const on = filter === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setFilter(c.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                className={`flex-row items-center gap-sm px-md min-h-[44px] rounded-full border ${on ? 'bg-accent border-accent' : 'border-border'}`}
              >
                <Text className={`text-body-md font-medium ${on ? 'text-accent-text' : 'text-text-primary'}`}>{c.label}</Text>
                <Text className={`text-body-sm ${on ? 'text-accent-text' : 'text-text-muted'}`}>{c.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {visible.length === 0 ? (
        <EmptyState message={filter === 'active' ? 'No open orders' : `Nothing in ${STAGE_LABEL[filter as OrderStage]}`} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(o) => o.id}
          numColumns={2}
          renderItem={({ item }) => <OrderCard order={item} onPress={() => openClient(item)} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
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

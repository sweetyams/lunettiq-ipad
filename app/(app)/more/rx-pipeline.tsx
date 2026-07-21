import { View, Text, FlatList, Pressable } from 'react-native';
import { useState } from 'react';
import { ClipboardList } from 'lucide-react-native';
import { useRxPipelineOrders, useRxPipelineCounts } from '@/src/api/useRxPipeline';
import type { RxOrder, RxOrderState } from '@/src/api/rx-pipeline.types';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { PermissionGate } from '@/src/ui/PermissionGate';
import { ScreenHeader } from '@/src/ui/ScreenHeader';

const STATE_LABELS: Record<RxOrderState, string> = {
  awaiting_rx: 'Awaiting Rx',
  ordered: 'Ordered',
  in_lab: 'In Lab',
  quality_check: 'QC',
  ready: 'Ready',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
};

const STATE_COLORS: Record<RxOrderState, string> = {
  awaiting_rx: 'bg-warning/20 text-warning',
  ordered: 'bg-blue/20 text-blue',
  in_lab: 'bg-blue/20 text-blue',
  quality_check: 'bg-warning/20 text-warning',
  ready: 'bg-green/20 text-green',
  picked_up: 'bg-warmGrey text-text-muted',
  cancelled: 'bg-warmGrey text-text-muted',
};

type FilterState = 'all' | RxOrderState;

const FILTERS: { key: FilterState; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_rx', label: 'Awaiting Rx' },
  { key: 'ordered', label: 'Ordered' },
  { key: 'in_lab', label: 'In Lab' },
  { key: 'ready', label: 'Ready' },
];

function RxOrderCard({ order }: { order: RxOrder }) {
  const colorClass = STATE_COLORS[order.state] || 'bg-warmGrey text-text-muted';
  const [bgClass, textClass] = colorClass.split(' ');

  return (
    <View className="bg-bg-surface rounded-lg border border-border p-md mb-sm">
      <View className="flex-row items-center justify-between mb-xs">
        <Text className="text-headline text-text-primary flex-1" numberOfLines={1}>
          {order.clientName}
        </Text>
        <View className={`rounded-full px-sm py-xs ${bgClass}`}>
          <Text className={`text-captionStrong ${textClass}`}>
            {STATE_LABELS[order.state]}
          </Text>
        </View>
      </View>
      {order.productName && (
        <Text className="text-body text-text-muted mb-xs" numberOfLines={1}>
          {order.productName}
        </Text>
      )}
      <View className="flex-row items-center justify-between">
        {order.lab && (
          <Text className="text-caption text-text-muted">Lab: {order.lab}</Text>
        )}
        {order.estimatedReadyAt && (
          <Text className="text-caption text-text-muted">
            Est. {new Date(order.estimatedReadyAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </Text>
        )}
        {!order.lab && !order.estimatedReadyAt && (
          <Text className="text-caption text-text-muted">
            Created {new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

function RxPipelineContent() {
  const [activeFilter, setActiveFilter] = useState<FilterState>('all');
  const { data: counts } = useRxPipelineCounts();
  const { data: orders, isLoading, error, refetch } = useRxPipelineOrders(
    activeFilter === 'all' ? undefined : { state: activeFilter }
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <ScreenHeader title="Rx Pipeline" subtitle="Track orders from lab to pickup" />
      
      {/* Counts row */}
      {counts && (
        <View className="flex-row gap-md px-xl py-sm">
          <View className="items-center">
            <Text className="text-headline text-text-primary">{counts.awaiting_rx}</Text>
            <Text className="text-caption text-text-muted">Awaiting</Text>
          </View>
          <View className="items-center">
            <Text className="text-headline text-text-primary">{counts.ordered + counts.in_lab}</Text>
            <Text className="text-caption text-text-muted">In Progress</Text>
          </View>
          <View className="items-center">
            <Text className="text-headline text-green">{counts.ready}</Text>
            <Text className="text-caption text-text-muted">Ready</Text>
          </View>
          <View className="items-center">
            <Text className="text-headline text-text-muted">{counts.total}</Text>
            <Text className="text-caption text-text-muted">Total</Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View className="px-xl py-md">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setActiveFilter(item.key)}
              className={`px-md py-sm rounded-full mr-sm min-h-[44px] justify-center ${
                activeFilter === item.key
                  ? 'bg-navy'
                  : 'border border-border'
              }`}
            >
              <Text className={`text-bodyStrong ${
                activeFilter === item.key ? 'text-white' : 'text-text-primary'
              }`}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Orders list */}
      {!orders || orders.length === 0 ? (
        <EmptyState
          message={activeFilter === 'all' ? 'No orders in the pipeline yet' : `No orders with status "${STATE_LABELS[activeFilter as RxOrderState]}"`}
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RxOrderCard order={item} />}
          contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

export default function RxPipelineScreen() {
  return (
    <PermissionGate
      permission="org:rx-pipeline:read"
      fallback={
        <View className="flex-1 bg-bg-page items-center justify-center p-xl">
          <ClipboardList size={48} color="#6B6B6B" />
          <Text className="text-headline text-text-primary mt-lg">Permission Required</Text>
          <Text className="text-body text-text-muted mt-sm text-center">
            You need Rx Pipeline access to view this screen
          </Text>
        </View>
      }
    >
      <RxPipelineContent />
    </PermissionGate>
  );
}

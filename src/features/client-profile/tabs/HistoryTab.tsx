import { View, Text } from 'react-native';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react-native';
import { useInteractions } from '@/src/api/useInteractions';
import { Badge, Button, FilterChips, Section } from '@/src/ui/kit';
import type { Interaction } from '@/src/api/interactions.types';

interface HistoryTabProps {
  clientId: string;
  onAddNote: () => void;
}

type Filter = 'all' | 'orders' | 'tryons' | 'notes' | 'visits';

const MATCH: Record<Exclude<Filter, 'all'>, (t: string) => boolean> = {
  orders: (t) => t === 'purchase_assist' || t.includes('order'),
  tryons: (t) => t === 'fitting' || t === 'tried_on' || t === 'session',
  notes: (t) => t === 'note',
  visits: (t) => t === 'in_store_visit' || t === 'visit' || t === 'appointment',
};

const TYPE_LABEL: Record<string, string> = {
  note: 'Note',
  phone_call: 'Call',
  call: 'Call',
  email: 'Email',
  sms: 'Text',
  in_store_visit: 'Visit',
  visit: 'Visit',
  fitting: 'Try-on',
  tried_on: 'Try-on',
  session: 'Visit',
  purchase_assist: 'Order',
  follow_up: 'Follow-up',
  appointment: 'Appointment',
  preferences_updated: 'Preferences',
};

function titleFor(i: Interaction): string {
  const m = i.metadata as Record<string, unknown>;
  if (i.subject) return i.subject;
  switch (i.type) {
    case 'fitting':
    case 'session':
      return m.frameCount ? `Tried ${m.frameCount} frames` : 'Try-on session';
    case 'tried_on':
      return typeof m.frameName === 'string' ? `Tried on ${m.frameName}` : 'Tried on a frame';
    case 'purchase_assist':
      return m.orderNumber ? `Order #${m.orderNumber}` : 'Order';
    case 'preferences_updated':
      return 'Preferences updated';
    default:
      return TYPE_LABEL[i.type] ?? i.type.replace(/_/g, ' ');
  }
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

export function HistoryTab({ clientId, onAddNote }: HistoryTabProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, error } = useInteractions(clientId);
  const all = useMemo(
    () => (data?.interactions ?? []).filter((i) => i.type !== 'privacy_mode_change').sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
    [data],
  );
  const counts = useMemo(() => {
    const c = { all: all.length } as Record<Filter, number>;
    for (const k of Object.keys(MATCH) as Array<Exclude<Filter, 'all'>>) c[k] = all.filter((i) => MATCH[k](i.type)).length;
    return c;
  }, [all]);
  const list = filter === 'all' ? all : all.filter((i) => MATCH[filter](i.type));

  return (
    <View className="gap-[16px]">
      <View className="flex-row items-center justify-between gap-[16px]">
        <View className="flex-1">
          <FilterChips<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'orders', label: 'Orders', count: counts.orders },
              { key: 'tryons', label: 'Try-ons', count: counts.tryons },
              { key: 'notes', label: 'Notes', count: counts.notes },
              { key: 'visits', label: 'Visits', count: counts.visits },
            ]}
          />
        </View>
        <Button label="Add note" icon={Plus} onPress={onAddNote} />
      </View>

      <Section padded={list.length === 0 || isLoading || !!error}>
        {isLoading ? (
          <Text className="text-body-sm text-text-tertiary">Loading history…</Text>
        ) : error ? (
          <Text className="text-body-sm text-text-tertiary">Couldn’t load history. Check the connection and try again shortly.</Text>
        ) : list.length === 0 ? (
          <Text className="text-body-sm text-text-tertiary">
            {filter === 'all' ? 'Visits, try-ons, orders and notes appear here as they happen.' : 'Nothing here yet.'}
          </Text>
        ) : (
          list.map((item, idx) => {
            const d = new Date(item.occurredAt);
            const newDay = idx === 0 || dayKey(list[idx - 1]!.occurredAt) !== dayKey(item.occurredAt);
            const m = item.metadata as Record<string, unknown>;
            return (
              <View key={item.id} className={`flex-row gap-[16px] px-[20px] py-[14px] ${idx > 0 ? 'border-t border-border' : ''}`}>
                <View className="w-[88px]">
                  {newDay ? (
                    <Text className="text-body-sm font-medium text-text-primary">
                      {d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    </Text>
                  ) : null}
                  <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
                    {d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
                <View className="flex-1 gap-[4px]">
                  <View className="flex-row items-center gap-[8px]">
                    <Text className="text-body-md font-medium text-text-primary flex-shrink" numberOfLines={1}>{titleFor(item)}</Text>
                    <Badge>{TYPE_LABEL[item.type] ?? 'Activity'}</Badge>
                    {m.status === 'ready_for_pickup' ? <Badge tone="success" dot>Ready for pickup</Badge> : null}
                  </View>
                  {item.body ? <Text className="text-body-sm text-text-secondary">{item.body}</Text> : null}
                  {typeof m.staffName === 'string' ? <Text className="text-body-sm text-text-tertiary">{m.staffName}</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </Section>
    </View>
  );
}

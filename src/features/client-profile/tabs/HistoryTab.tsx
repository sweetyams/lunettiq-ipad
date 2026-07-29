import { View, Text, FlatList } from 'react-native';
import { useState } from 'react';
import { Card, Chip, Button, Tag } from '@/src/ui';
import { useInteractions } from '@/src/api/useInteractions';
import type { Interaction } from '@/src/api/interactions.types';

interface HistoryTabProps {
  clientId: string;
}

type FilterType = 'all' | 'orders' | 'tryons' | 'notes' | 'visits';

export function HistoryTab({ clientId }: HistoryTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { data, isLoading, error } = useInteractions(clientId);
  const interactions = data?.interactions;

  const filterInteractions = (interactions: Interaction[] | undefined): Interaction[] => {
    if (!interactions) return [];
    
    switch (activeFilter) {
      case 'orders':
        return interactions.filter(i => 
          i.type === 'purchase_assist' || i.type.includes('order')
        );
      case 'tryons':
        return interactions.filter(i => i.type === 'fitting');
      case 'notes':
        return interactions.filter(i => i.type === 'note');
      case 'visits':
        return interactions.filter(i => i.type === 'in_store_visit');
      default:
        return interactions;
    }
  };

  const formatDate = (date: string, index: number, interactions: Interaction[]): { date: string; time: string } => {
    const current = new Date(date);
    const prev = index > 0 ? interactions[index - 1] : null;
    const previous = prev ? new Date(prev.occurredAt) : null;
    
    const isSameDay = previous && 
      current.getDate() === previous.getDate() &&
      current.getMonth() === previous.getMonth() &&
      current.getFullYear() === previous.getFullYear();

    const dateStr = current.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short' 
    }).replace(',', '');
    
    const timeStr = current.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    return {
      date: isSameDay ? '' : dateStr,
      time: timeStr
    };
  };

  const getInteractionDisplay = (interaction: Interaction): { title: string; tag?: { label: string; variant: 'ok' | 'warn' | 'err' } } => {
    switch (interaction.type) {
      case 'fitting':
        return {
          title: `Try-on session · ${(interaction.metadata as any)?.frameCount || 0} frames`
        };
      case 'note':
        return {
          title: interaction.subject || 'Consultation note'
        };
      case 'in_store_visit':
        return {
          title: `Store visit · ${(interaction.metadata as any)?.location || 'Unknown location'}`
        };
      case 'purchase_assist':
        return {
          title: `Order #${(interaction.metadata as any)?.orderNumber} · $${(interaction.metadata as any)?.total}`,
          tag: (interaction.metadata as any)?.status === 'ready_for_pickup' 
            ? { label: 'Ready for pickup', variant: 'ok' }
            : undefined
        };
      case 'preferences_updated':
        return {
          title: 'Preferences updated'
        };
      case 'appointment':
        return {
          title: interaction.subject || 'Appointment'
        };
      default:
        return {
          title: interaction.subject || interaction.type.replace(/_/g, ' ')
        };
    }
  };

  const handleAddNote = () => {
    console.log('Add note pressed for client:', clientId);
  };

  const handleRxPipeline = () => {
    console.log('Navigate to Rx pipeline for client:', clientId);
  };

  const filteredInteractions = filterInteractions(interactions);

  const renderInteraction = ({ item, index }: { item: Interaction; index: number }) => {
    const { date, time } = formatDate(item.occurredAt, index, filteredInteractions);
    const { title, tag } = getInteractionDisplay(item);

    return (
      <View className={`flex-row py-md ${index < filteredInteractions.length - 1 ? 'border-b border-color-border' : ''}`}>
        {/* Date column - 76px fixed width */}
        <View className="w-[76px]">
          {date && (
            <Text className="text-caption-sm font-mono text-color-text-muted">
              {date}
            </Text>
          )}
          <Text className="text-caption-sm font-mono text-color-text-muted">
            {time}
          </Text>
        </View>

        {/* Content column - flex-1 */}
        <View className="flex-1">
          <View className="flex-row items-center gap-sm">
            <Text className="text-body-md font-medium text-color-text-primary">
              {title}
            </Text>
            {tag && (
              <Tag label={tag.label} variant={tag.variant} />
            )}
          </View>
          
          {item.body && (
            <Text className="text-body-sm text-color-text-secondary mt-xs">
              {item.body}
            </Text>
          )}
          
          <Text className="text-caption-md text-color-text-muted mt-xs">
            {(item.metadata as any)?.staffName || 'Staff'} · {(item.metadata as any)?.location || 'Store'}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 p-lg">
        <View className="flex-row justify-between items-center mb-lg">
          <View className="flex-row gap-sm">
            {['All', 'Orders', 'Try-ons', 'Notes', 'Visits'].map((filter) => (
              <View key={filter} className="bg-color-skeleton-bg rounded-md h-8 w-16" />
            ))}
          </View>
          <View className="flex-row gap-sm">
            <View className="bg-color-skeleton-bg rounded-md h-8 w-24" />
            <View className="bg-color-skeleton-bg rounded-md h-8 w-20" />
          </View>
        </View>
        <Card className="flex-1 p-lg">
          <View className="space-y-lg">
            {[1, 2, 3].map((i) => (
              <View key={i} className="flex-row gap-md">
                <View className="w-[76px] space-y-xs">
                  <View className="bg-color-skeleton-bg rounded h-4 w-12" />
                  <View className="bg-color-skeleton-bg rounded h-4 w-10" />
                </View>
                <View className="flex-1 space-y-xs">
                  <View className="bg-color-skeleton-bg rounded h-4 w-48" />
                  <View className="bg-color-skeleton-bg rounded h-4 w-64" />
                  <View className="bg-color-skeleton-bg rounded h-3 w-32" />
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 p-lg">
        <Card className="flex-1 items-center justify-center p-xl">
          <Text className="text-body-lg text-color-text-primary mb-sm">
            Unable to load history
          </Text>
          <Text className="text-body-sm text-color-text-secondary text-center">
            There was an error loading the client's interaction history.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 p-lg">
      {/* Filter row */}
      <View className="flex-row justify-between items-center mb-lg">
        <View className="flex-row gap-sm">
          {[
            { key: 'all' as const, label: 'All' },
            { key: 'orders' as const, label: 'Orders' },
            { key: 'tryons' as const, label: 'Try-ons' },
            { key: 'notes' as const, label: 'Notes' },
            { key: 'visits' as const, label: 'Visits' }
          ].map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              variant={activeFilter === key ? 'on' : 'default'}
              onPress={() => setActiveFilter(key)}
            />
          ))}
        </View>

        <View className="flex-row gap-sm">
          <Button
            variant="quiet"
            size="sm"
            onPress={handleRxPipeline}
          >
            Rx pipeline →
          </Button>
          <Button
            variant="dark"
            size="sm"
            onPress={handleAddNote}
          >
            + Add note
          </Button>
        </View>
      </View>

      {/* Timeline */}
      <Card className="flex-1">
        {filteredInteractions.length === 0 ? (
          <View className="flex-1 items-center justify-center p-xl">
            <Text className="text-body-lg text-color-text-primary mb-sm">
              No history yet
            </Text>
            <Text className="text-body-sm text-color-text-secondary text-center">
              {activeFilter === 'all' 
                ? "This client's interactions will appear here as they happen."
                : `No ${activeFilter} found for this client.`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredInteractions}
            renderItem={renderInteraction}
            keyExtractor={(item) => item.id}
            className="p-lg"
            showsVerticalScrollIndicator={false}
          />
        )}
      </Card>
    </View>
  );
}
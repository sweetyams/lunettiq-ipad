import { useState, useCallback } from 'react';
import { View, FlatList, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClients } from '@/src/api/useClients';
import { SearchBar } from '@/src/ui/SearchBar';
import { ClientCard } from '@/src/ui/ClientCard';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';
import type { Client } from '@/src/api/clients.types';
import ClientDetailPanel from './[id]';

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useClients({
    q: search || undefined,
    limit: 50,
  });

  const handleSelectClient = useCallback((shopifyId: string) => {
    setSelectedId(shopifyId);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Client }) => (
      <ClientCard
        client={item}
        onPress={handleSelectClient}
        isSelected={item.shopifyId === selectedId}
      />
    ),
    [selectedId, handleSelectClient],
  );

  const keyExtractor = useCallback((item: Client) => item.shopifyId, []);

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      {/* Split view: list left, detail right */}
      <View className="flex-1 flex-row">
        {/* Left panel — client list */}
        <View className="w-2/5 border-r border-warmGrey bg-white">
          {/* Search bar */}
          <View className="p-md">
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search clients…"
            />
          </View>

          {/* List states */}
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              error={error instanceof Error ? error.message : 'Failed to load clients'}
              onRetry={refetch}
            />
          ) : !data?.clients.length ? (
            <EmptyState
              message={search ? 'No clients match your search' : 'No clients yet'}
            />
          ) : (
            <FlatList
              data={data.clients}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Right panel — client detail */}
        <View className="flex-1 bg-offWhite">
          {selectedId ? (
            <ClientDetailPanel id={selectedId} />
          ) : (
            <View className="flex-1 items-center justify-center p-xl">
              <Text className="text-midGrey text-body text-center">
                Select a client to view their profile
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

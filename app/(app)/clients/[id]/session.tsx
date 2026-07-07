import { View, Text, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useClient } from '@/src/api/useClients';
import { useProducts } from '@/src/api/useProducts';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { ClientContextPanel } from '@/src/features/session/ClientContextPanel';
import { ProductCard } from '@/src/ui/ProductCard';
import { SearchBar } from '@/src/ui/SearchBar';
import { Button } from '@/src/ui/Button';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';

export default function SessionWorkspaceScreen() {
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(clientId);
  const { activeClientId, mode, sessionStartedAt } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);

  // Redirect if no active session or wrong client
  useEffect(() => {
    if (!clientLoading && (!activeClientId || activeClientId !== clientId || mode !== 'session')) {
      router.replace(`/clients/${clientId}`);
    }
  }, [activeClientId, clientId, mode, clientLoading, router]);

  // Update session duration timer
  useEffect(() => {
    if (!sessionStartedAt) return;
    
    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartedAt]);

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({
    q: searchQuery || undefined,
    limit: 50,
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProductPress = (shopifyId: string) => {
    router.push(`/products/${shopifyId}`);
  };

  const handleStartFitting = () => {
    // TODO: Navigate to fitting mode
    console.log('Start fitting');
  };

  if (clientLoading) return <LoadingState />;
  if (clientError) return <ErrorState error={clientError} onRetry={() => router.back()} />;
  if (!client) return <ErrorState error={new Error('Client not found')} onRetry={() => router.back()} />;

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown';

  const renderProduct = ({ item }: { item: any }) => (
    <ProductCard product={item} onPress={handleProductPress} />
  );

  return (
    <View className="flex-1 bg-offWhite">
      {/* TopBar with session chip */}
      <View className="bg-white border-b border-warmGrey p-lg flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Session chip */}
          <View className="bg-navy rounded-full px-md py-sm mr-lg">
            <Text className="text-white text-caption font-medium">
              Session · {clientName} · {formatDuration(sessionDuration)}
            </Text>
          </View>
        </View>

        {/* Start fitting button */}
        <Button variant="primary" onPress={handleStartFitting}>
          Start fitting
        </Button>
      </View>

      <View className="flex-1 flex-row">
        {/* Left panel - Product browser */}
        <View className="flex-[3] bg-white">
          {/* Browser header */}
          <View className="p-lg border-b border-warmGrey">
            <Text className="text-charcoal text-bodyStrong mb-md">
              Browsing for {clientName}
            </Text>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search frames…"
            />
          </View>

          {/* Product grid */}
          <View className="flex-1">
            {productsLoading ? (
              <LoadingState />
            ) : productsError ? (
              <ErrorState error={productsError} onRetry={refetchProducts} />
            ) : !products || products.length === 0 ? (
              <EmptyState 
                message={searchQuery ? `No frames match "${searchQuery}"` : 'No frames available'}
                actionLabel={searchQuery ? 'Clear search' : undefined}
                onAction={searchQuery ? () => setSearchQuery('') : undefined}
              />
            ) : (
              <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.shopifyId}
                numColumns={3}
                columnWrapperStyle={{ paddingHorizontal: 16, gap: 16 }}
                contentContainerStyle={{ padding: 16, gap: 16 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        {/* Right panel - Client context */}
        <View className="flex-[2] border-l border-warmGrey">
          <ClientContextPanel clientId={clientId} />
        </View>
      </View>
    </View>
  );
}
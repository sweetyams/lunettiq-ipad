import { View, Text, Pressable, TextInput, ScrollView, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Eye, Camera, User, Sparkles, ShoppingCart, ExternalLink, Filter } from 'lucide-react-native';

import { useProducts } from '@/src/api/useProducts';
import { useFilters } from '@/src/api/useFilters';
import { useSuggestions } from '@/src/api/useSuggestions';
import { useClient, useClientEnrichment, useClientPreferences } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import type { FrameTried } from '@/src/features/session/useSessionStore';
import { ProductCard, SearchBar, Button } from '@/src/ui';
import { FilterSheet } from '@/src/ui/FilterSheet';
import type { Product, ProductListParams } from '@/src/api/products.types';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';

type SortOption = 'best-match' | 'newest' | 'price-asc' | 'price-desc';

export default function SessionWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const {
    mode,
    activeClientId,
    activeClientName,
    sessionStartedAt,
    framesTried,
    sessionNotes,
    setSessionNotes,
    endSession,
    addFrameTried,
    updateFrameVerdict,
    removeFrameTried,
    startFitting,
  } = useSessionStore();

  // API data
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id);
  const { data: clientEnrichment } = useClientEnrichment(id);
  const { data: clientPreferences } = useClientPreferences(id);
  
  // Product search state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best-match');
  const [showFilters, setShowFilters] = useState(false);
  
  // AI Stylist state
  const [aiPrompt, setAiPrompt] = useState('');
  const [sessionDuration, setSessionDuration] = useState('00:00');

  // Products API - using the correct pattern
  const queryParams: ProductListParams = { 
    q: search || undefined, 
    limit: 50, 
    offset: 0 
  };
  const { data: productsResponse, isLoading: productsLoading, error: productsError } = useProducts(queryParams);
  const products = productsResponse?.data ?? []; // Correct pattern: ProductListResponse has .data array

  // Filters and suggestions
  const { data: filterData } = useFilters();
  const { data: suggestionsResponse } = useSuggestions(id, { limit: 12 });
  const suggestions = suggestionsResponse ?? [];

  // Timer effect
  useEffect(() => {
    if (!sessionStartedAt) return;

    const updateTimer = () => {
      const elapsed = Date.now() - sessionStartedAt;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setSessionDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  // Filter and sort products
  const filteredProducts = products
    .sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'newest':
          return 0; // Would use createdAt if available
        case 'price-asc':
          const aPriceMin = a.priceMin ? parseFloat(a.priceMin) : 0;
          const bPriceMin = b.priceMin ? parseFloat(b.priceMin) : 0;
          return aPriceMin - bPriceMin;
        case 'price-desc':
          const aPriceMax = a.priceMax ? parseFloat(a.priceMax) : 0;
          const bPriceMax = b.priceMax ? parseFloat(b.priceMax) : 0;
          return bPriceMax - aPriceMax;
        case 'best-match':
        default:
          // Put suggested products first
          const aInSuggestions = suggestions.some((s: { productId: string }) => s.productId === a.id);
          const bInSuggestions = suggestions.some((s: { productId: string }) => s.productId === b.id);
          if (aInSuggestions && !bInSuggestions) return -1;
          if (!aInSuggestions && bInSuggestions) return 1;
          return 0;
      }
    });

  // Handlers
  const handleAddFrame = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId || p.shopifyId === productId);
    if (!product) return;

    const title = typeof product.title === 'string' 
      ? product.title 
      : product.title?.en ?? product.title?.fr ?? '';

    const newFrame: FrameTried = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: title,
      verdict: undefined,
      notes: '',
      photoIds: [],
      triedAt: Date.now(),
    };
    addFrameTried(newFrame);
  }, [products, addFrameTried]);

  const handleEndSession = useCallback(() => {
    endSession();
    router.replace('/home');
  }, [endSession, router]);

  const handleHandToClient = useCallback(() => {
    // Navigate to handed mode or toggle privacy
    console.log('Hand to client');
  }, []);

  const handleCaptureFitting = useCallback(() => {
    startFitting();
    router.push(`/clients/${id}/fitting`);
  }, [startFitting, router, id]);

  const handleAiStylist = useCallback(() => {
    if (!aiPrompt.trim()) return;
    console.log('AI Stylist:', aiPrompt);
    setAiPrompt('');
  }, [aiPrompt]);

  const handleVerdictChange = useCallback((frameId: string, verdict: FrameTried['verdict']) => {
    updateFrameVerdict(frameId, verdict);
  }, [updateFrameVerdict]);

  const handleRemoveFrame = useCallback((frameId: string) => {
    removeFrameTried(frameId);
  }, [removeFrameTried]);

  // Guard clause - ensure we're in session mode with correct client
  if (mode !== 'session' || activeClientId !== id) {
    return (
      <View className="flex-1 bg-bg-page justify-center items-center">
        <Text className="text-heading-lg text-text-primary">No active session</Text>
        <Text className="text-body-lg text-text-secondary mt-sm">Start a session to continue</Text>
        <Button variant="primary"
          onPress={() => router.replace('/home')}
          className="mt-lg"
        >
          Return to Home
        </Button>
      </View>
    );
  }

  if (clientLoading) return <LoadingState />;
  if (clientError) return <ErrorState error={clientError} onRetry={() => {}} />;
  if (!client) return <EmptyState message="Client not found" />;

  const renderProduct = ({ item: product }: { item: Product }) => {
    // Check if this product is in suggestions for fit scoring
    const suggestion = suggestions.find(s => s.productId === product.id);
    const fitScore = suggestion?.score ?? null;
    const fitReasons = suggestion?.matchReasons;

    return (
      <View className="flex-1 mx-1 mb-md">
        <ProductCard
          product={product}
          onPress={handleAddFrame}
          fitScore={fitScore}
          fitReasons={fitReasons}
        />
      </View>
    );
  };

  const renderFrameTried = ({ item: frame }: { item: FrameTried }) => (
    <View className="bg-bg-surface rounded-lg border border-border p-sm mb-sm">
      <View className="flex-row items-center justify-between mb-xs">
        <Text className="text-body-sm text-text-primary font-medium flex-1" numberOfLines={1}>
          {frame.productName}
        </Text>
        <Pressable
          onPress={() => handleRemoveFrame(frame.id)}
          className="w-6 h-6 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Remove frame"
        >
          <Text className="text-text-muted">×</Text>
        </Pressable>
      </View>
      
      {/* Verdict buttons */}
      <View className="flex-row gap-xs mt-sm">
        {(['loved', 'liked', 'unsure', 'rejected'] as const).map((verdict) => (
          <Pressable
            key={verdict}
            onPress={() => handleVerdictChange(frame.id, verdict)}
            className={`flex-1 py-xs px-xs rounded-md items-center min-h-[32px] justify-center ${
              frame.verdict === verdict
                ? verdict === 'loved' ? 'bg-verdict-loved' :
                  verdict === 'liked' ? 'bg-verdict-liked' :
                  verdict === 'unsure' ? 'bg-verdict-unsure' :
                  'bg-verdict-rejected'
                : 'bg-bg-muted border border-border'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Mark as ${verdict}`}
          >
            <Text className={`text-caption-sm font-medium ${
              frame.verdict === verdict
                ? verdict === 'loved' ? 'text-text-inverse' :
                  verdict === 'liked' ? 'text-text-inverse' :
                  verdict === 'unsure' ? 'text-text-primary' :
                  'text-text-inverse'
                : 'text-text-muted'
            }`}>
              {verdict === 'loved' ? '♥' :
               verdict === 'liked' ? '👍' :
               verdict === 'unsure' ? '?' : '×'}
            </Text>
          </Pressable>
        ))}
      </View>

      {frame.verdict && (
        <View className={`rounded-md px-xs py-xs mt-xs ${
          frame.verdict === 'loved' ? 'bg-verdict-loved' :
          frame.verdict === 'liked' ? 'bg-verdict-liked' :
          frame.verdict === 'unsure' ? 'bg-verdict-unsure' :
          'bg-verdict-rejected'
        }`}>
          <Text className={`text-caption-sm font-medium ${
            frame.verdict === 'loved' ? 'text-text-inverse' :
            frame.verdict === 'liked' ? 'text-text-inverse' :
            frame.verdict === 'unsure' ? 'text-text-primary' :
            'text-text-inverse'
          }`}>
            {frame.verdict === 'loved' ? 'Loved' :
             frame.verdict === 'liked' ? 'Liked' :
             frame.verdict === 'unsure' ? 'Unsure' : 'Rejected'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* Session Bar */}
      <View className="bg-bg-inverse px-lg py-sm border-b border-border-inverse">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-2 h-2 bg-error rounded-full mr-sm" />
            <View className="bg-bg-surface rounded-full px-md py-sm mr-md">
              <Text className="text-body-sm text-text-primary font-medium">
                Session · {activeClientName} · {sessionDuration}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-sm">
            <Pressable
              onPress={handleHandToClient}
              className="bg-accent rounded-md px-md py-sm flex-row items-center min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel="Hand to client"
            >
              <Eye size={16} color="white" />
              <Text className="text-body-sm text-accent-text ml-xs">Hand to client</Text>
            </Pressable>

            <Pressable
              onPress={handleCaptureFitting}
              className="bg-accent rounded-md px-md py-sm flex-row items-center min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel="Capture fitting photos"
            >
              <Camera size={16} color="white" />
              <Text className="text-body-sm text-accent-text ml-xs">Capture fitting photos</Text>
            </Pressable>

            <Pressable
              onPress={handleEndSession}
              className="bg-brand rounded-md px-md py-sm min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="End session"
            >
              <Text className="text-body-sm text-brand-text font-medium">End session</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Product Browser - Left Panel */}
        <View className="flex-1 p-lg">
          {/* Search and filters */}
          <View className="mb-lg">
            <View className="flex-row items-center gap-sm mb-sm">
              <View className="flex-1">
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search frames..."
                />
              </View>
              <Pressable
                onPress={() => setShowFilters(true)}
                className="bg-bg-surface border border-border rounded-md px-sm py-sm min-h-[44px] justify-center flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Filter products"
              >
                <Filter size={16} color="#737373" />
                <Text className="text-body-sm text-text-primary ml-xs">Filter</Text>
              </Pressable>
            </View>

            {/* Sort pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-sm">
              <View className="flex-row gap-xs">
                {([
                  { key: 'best-match', label: 'Best match' },
                  { key: 'newest', label: 'Newest' },
                  { key: 'price-asc', label: 'Price ↑' },
                  { key: 'price-desc', label: 'Price ↓' },
                ] as const).map((sort) => (
                  <Pressable
                    key={sort.key}
                    onPress={() => setSortBy(sort.key)}
                    className={`rounded-full px-md py-xs min-h-[44px] justify-center ${
                      sortBy === sort.key 
                        ? 'bg-brand' 
                        : 'bg-bg-surface border border-border'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${sort.label}`}
                  >
                    <Text className={`text-body-sm ${
                      sortBy === sort.key 
                        ? 'text-brand-text' 
                        : 'text-text-primary'
                    }`}>
                      {sort.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Fit filter chip */}
            {clientEnrichment && (
              <View className="bg-bg-muted rounded-full px-md py-xs self-start">
                <Text className="text-body-sm text-text-secondary">
                  Good fit for {client.firstName}
                </Text>
              </View>
            )}
          </View>

          {/* Product grid */}
          {productsLoading ? (
            <LoadingState />
          ) : productsError ? (
            <ErrorState error={productsError} onRetry={() => {}} />
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <EmptyState 
                  message="No frames match your search"
                  onAction={search ? () => setSearch('') : undefined}
                  actionLabel={search ? "Clear search" : undefined}
                />
              }
            />
          )}
        </View>

        {/* Session Rail - Right Panel */}
        <View className="w-[340px] bg-bg-surface border-l border-border">
          <ScrollView className="flex-1 p-lg" showsVerticalScrollIndicator={false}>
            {/* Client section */}
            <View className="mb-lg">
              <View className="flex-row items-center mb-sm">
                <View className="w-10 h-10 bg-bg-muted rounded-full items-center justify-center mr-sm">
                  <User size={20} color="#737373" />
                </View>
                <View className="flex-1">
                  <Text className="text-heading-sm text-text-primary font-medium">
                    {client.firstName} {client.lastName}
                  </Text>
                  <Text className="text-body-sm text-text-secondary">
                    MEMBER
                  </Text>
                </View>
              </View>
              
              {/* Client details */}
              <View className="mb-sm space-y-1">
                {clientEnrichment && (
                  <>
                    <Text className="text-caption-md text-text-muted">
                      Fit: {clientEnrichment.frameWidthMm || 'Medium'} frame, —
                    </Text>
                  </>
                )}
                {clientPreferences && (
                  <>
                    <Text className="text-caption-md text-text-muted">
                      Prefers: {clientPreferences.stated?.shapes?.join(", ") || 'Bold styles, dark colors'}
                    </Text>
                    <Text className="text-caption-md text-text-muted">
                      Avoid: {clientPreferences.stated?.avoid?.join(", ") || 'Thin frames, light metals'}
                    </Text>
                  </>
                )}
                <Text className="text-caption-md text-text-muted">Budget: $400-800</Text>
              </View>

              <Pressable
                onPress={() => router.push(`/clients/${id}`)}
                className="flex-row items-center py-xs"
                accessibilityRole="button"
                accessibilityLabel="Open client profile"
              >
                <ExternalLink size={14} color="#000EC7" />
                <Text className="text-body-sm text-brand ml-xs">Open profile</Text>
              </Pressable>
            </View>

            {/* AI Stylist section */}
            <View className="mb-lg">
              <View className="flex-row items-center mb-sm">
                <Sparkles size={16} color="#000EC7" />
                <Text className="text-heading-sm text-text-primary font-medium ml-xs">
                  AI Stylist
                </Text>
              </View>
              
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="Describe what you're looking for..."
                multiline
                numberOfLines={3}
                className="bg-bg-page border border-border rounded-md p-sm text-body-sm text-text-primary mb-sm min-h-[80px]"
                placeholderTextColor="#737373"
              />
              
              <View className="flex-row gap-sm">
                <Pressable
                  onPress={handleAiStylist}
                  className="flex-1 bg-brand rounded-md py-sm items-center min-h-[44px] justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Get AI suggestions"
                >
                  <Text className="text-body-sm text-brand-text font-medium">
                    Suggest frames
                  </Text>
                </Pressable>
                
                <Pressable
                  className="bg-bg-page border border-border rounded-md px-sm py-sm min-h-[44px] justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Multi-pair recommendations"
                >
                  <Text className="text-body-sm text-text-primary">Multi-pair →</Text>
                </Pressable>
              </View>
            </View>

            {/* Session tray */}
            <View className="mb-lg">
              <Text className="text-heading-sm text-text-primary font-medium mb-sm">
                Session tray ({framesTried.length})
              </Text>
              
              {framesTried.length === 0 ? (
                <View className="bg-bg-page rounded-lg p-md items-center">
                  <Text className="text-body-sm text-text-muted text-center">
                    Add frames from the browser to start building recommendations
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={framesTried}
                  renderItem={renderFrameTried}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

            {/* Session notes */}
            <View className="mb-lg">
              <Text className="text-heading-sm text-text-primary font-medium mb-sm">
                Session notes
              </Text>
              <TextInput
                value={sessionNotes}
                onChangeText={setSessionNotes}
                placeholder="Add notes about this session..."
                multiline
                numberOfLines={4}
                className="bg-bg-page border border-border rounded-md p-sm text-body-sm text-text-primary min-h-[100px]"
                placeholderTextColor="#737373"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-lg border-t border-border">
            <Pressable
              className="bg-brand rounded-md py-sm items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Create order from session tray"
            >
              <View className="flex-row items-center">
                <ShoppingCart size={16} color="white" />
                <Text className="text-body-sm text-brand-text font-medium ml-xs">
                  Create order from tray
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Filter Sheet */}
      {showFilters && (
        <FilterSheet
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filterData={filterData}
          selectedFacets={{}}
          selectedStock={[]}
          onFacetToggle={() => {}}
          onStockToggle={() => {}}
          onClear={() => {}}
          activeCount={0}
        />
      )}
    </View>
  );
}
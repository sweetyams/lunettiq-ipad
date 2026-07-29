import { View, Text, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { User, Search } from 'lucide-react-native';

import { useClients } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar, Button, Chip, Tag, StatCard, ProfileGapChips } from '@/src/ui';
import type { Client, ClientSearchParams } from '@/src/api/clients.types';

// --- Types ---
type FilterType = 'all' | 'recent' | 'cult' | 'vault' | 'incomplete';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recent' },
  { key: 'cult', label: 'CULT' },
  { key: 'vault', label: 'VAULT' },
  { key: 'incomplete', label: 'Incomplete' },
];

// --- Main Screen ---
export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build search params from filter + query
  const searchParams = useMemo((): ClientSearchParams => {
    const params: ClientSearchParams = { limit: 50 };
    if (debouncedQuery) params.q = debouncedQuery;

    switch (activeFilter) {
      case 'recent':
        params.sort = 'updatedAt';
        params.limit = 20;
        break;
      case 'cult':
        params.tag = 'member-cult';
        break;
      case 'vault':
        params.tag = 'member-vault';
        break;
      case 'incomplete':
        // P0 API gap — for now show all, will filter client-side
        break;
    }
    return params;
  }, [debouncedQuery, activeFilter]);

  // Fetch clients
  const { data, isLoading, error, refetch } = useClients(searchParams);
  const clients = data?.clients ?? [];
  const total = data?.total ?? 0;

  // Selected client for preview
  const selectedClient = useMemo(
    () => (selectedClientId ? clients.find((c) => c.id === selectedClientId) : clients[0]) ?? null,
    [selectedClientId, clients],
  );

  // Auto-select first client when list loads
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      const first = clients[0];
      if (first) setSelectedClientId(first.id);
    }
  }, [clients, selectedClientId]);

  const renderClientRow = useCallback(
    ({ item }: { item: Client }) => (
      <ClientRow
        client={item}
        isSelected={selectedClientId === item.id}
        onPress={() => setSelectedClientId(item.id)}
      />
    ),
    [selectedClientId],
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* TopBar */}
      <View className="flex-row items-center justify-between px-lg py-md border-b border-border">
        <Text className="text-heading-lg text-text-primary">Clients</Text>
        <Text className="text-body-sm text-text-muted">
          <Text className="font-mono">{total.toLocaleString()}</Text> total
        </Text>
      </View>

      {/* Split View */}
      <View className="flex-1 flex-row">
        {/* Left Panel — 452px fixed */}
        <View className="w-[452px] border-r border-border flex-col">
          {/* Search */}
          <View className="px-lg py-md">
            <View className="flex-row items-center bg-bg-surface border border-border rounded-sm px-[12px] min-h-[44px]">
              <Search size={16} color="rgba(29,31,33,0.45)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name, email, or phone"
                placeholderTextColor="rgba(29,31,33,0.45)"
                className="flex-1 ml-sm text-body-md text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Filter Pills */}
          <View className="flex-row gap-sm px-lg pb-md">
            {FILTERS.map((f) => (
              <Chip
                key={f.key}
                label={f.label}
                variant={activeFilter === f.key ? 'on' : 'default'}
                onPress={() => setActiveFilter(f.key)}
              />
            ))}
          </View>

          {/* Client List */}
          <View className="flex-1 border-t border-border">
            {isLoading ? (
              <ListLoadingState />
            ) : error ? (
              <ListErrorState onRetry={refetch} />
            ) : clients.length === 0 ? (
              <ListEmptyState searchQuery={searchQuery} />
            ) : (
              <FlatList
                data={clients}
                keyExtractor={(item) => item.id}
                renderItem={renderClientRow}
                showsVerticalScrollIndicator={false}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            )}
          </View>

          {/* New Client Button — pinned at bottom */}
          <View className="px-lg py-md border-t border-border">
            <Button
              variant="ghost"
              block
              onPress={() => router.push('/clients/new')}
              accessibilityLabel="Create new client"
            >
              + New client
            </Button>
          </View>
        </View>

        {/* Right Panel — Preview */}
        <View className="flex-1">
          {selectedClient ? (
            <ClientPreview client={selectedClient} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <User size={48} color="rgba(29,31,33,0.18)" />
              <Text className="text-body-md text-text-muted mt-md">
                Select a client to preview
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// --- Client Row ---
interface ClientRowProps {
  client: Client;
  isSelected: boolean;
  onPress: () => void;
}

function ClientRow({ client, isSelected, onPress }: ClientRowProps) {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ');
  const hasCultTag = (client.tags ?? []).some((t) => t === 'member-cult');
  const hasVaultTag = (client.tags ?? []).some((t) => t === 'member-vault');

  // Relative time
  const activityText = useMemo(() => {
    const diff = Math.floor((Date.now() - new Date(client.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(client.updatedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  }, [client.updatedAt]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name || 'Unnamed client'}, last activity ${activityText}`}
      className={`flex-row items-center gap-[12px] px-lg py-[12px] min-h-[72px] border-b border-bg-muted ${
        isSelected ? 'bg-bg-muted border-l-[3px] border-l-brand' : ''
      }`}
    >
      <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-sm">
          <Text
            className={`text-body-md text-text-primary ${name ? 'font-medium' : ''}`}
            numberOfLines={1}
          >
            {name || 'No name yet'}
          </Text>
          {hasCultTag && <Tag label="CULT" variant="cult" />}
          {hasVaultTag && <Tag label="VAULT" variant="vault" />}
        </View>
        <Text className="text-body-sm text-text-muted" numberOfLines={1}>
          {client.email || 'No email'}
        </Text>
      </View>

      <Text className="text-caption-sm font-mono text-text-muted">{activityText}</Text>
    </Pressable>
  );
}

// --- Client Preview Panel ---
interface ClientPreviewProps {
  client: Client;
}

function ClientPreview({ client }: ClientPreviewProps) {
  const router = useRouter();
  const { startSession } = useSessionStore();
  const privacyMode = usePrivacyStore((s) => s.mode);

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';

  // Tier from tags
  const tierTag = (client.tags ?? []).find((t) => t.startsWith('member-'));
  const tier = tierTag?.replace('member-', '').toUpperCase() ?? null;
  const tierVariant = tier === 'CULT' ? 'cult' : tier === 'VAULT' ? 'vault' : 'default';

  // Active status (activity within 90 days)
  const daysSince = Math.floor((Date.now() - new Date(client.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const isActive = daysSince < 90;

  // Stats
  const formatCurrency = (amount: number | null): string => {
    if (privacyMode === 'client') return '••••';
    if (!amount) return '$0.00';
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatLastVisit = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 30) return `${diff} days ago`;
    return new Date(dateStr).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' });
  };

  // Contact summary line
  const contactParts = [
    client.email,
    client.phone || 'No phone',
    'EN', // TODO: from client language preference
  ].filter(Boolean);

  // Profile gaps (computed from missing data)
  const gaps = useMemo(() => {
    const g: { id: string; label: string }[] = [];
    // These would come from a completeness endpoint (P0 API gap)
    // For now compute from available data
    g.push({ id: 'rx', label: 'Prescription' });
    g.push({ id: 'fit', label: 'Fit measurements' });
    g.push({ id: 'lifestyle', label: 'Lifestyle' });
    g.push({ id: 'insurance', label: 'Insurance' });
    return g;
  }, []);

  const handleStartSession = useCallback(() => {
    startSession(client.id, name);
    router.push(`/clients/${client.id}/session`);
  }, [client.id, name, startSession, router]);

  const handleGapPress = useCallback((gapId: string) => {
    // Navigate to profile with the relevant sheet open
    router.push(`/clients/${client.id}`);
  }, [client.id, router]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-[40px] py-xl"
      showsVerticalScrollIndicator={false}
    >
      {/* Identity Header */}
      <View className="flex-row items-center gap-lg">
        <Avatar firstName={client.firstName} lastName={client.lastName} size="lg" />
        <View className="flex-1">
          <View className="flex-row items-center gap-[12px]">
            <Text className="text-heading-xl text-text-primary">{name}</Text>
            {tier && <Tag label={tier} variant={tierVariant as 'cult' | 'vault' | 'default'} />}
            {isActive && <Tag label="Active" variant="ok" />}
          </View>
          <Text className="text-body-md text-text-secondary mt-[2px]">
            {contactParts.join(' \u00B7 ')}
          </Text>
        </View>
      </View>

      {/* Stats Card */}
      <View className="mt-lg">
        <StatCard
          stats={[
            { value: String(client.orderCount ?? 0), label: 'Orders' },
            { value: formatCurrency(client.totalSpent), label: 'Lifetime value' },
            { value: formatLastVisit(client.updatedAt), label: 'Last visit' },
          ]}
        />
      </View>

      {/* Profile Gaps */}
      <View className="mt-lg">
        <ProfileGapChips gaps={gaps} onGapPress={handleGapPress} />
      </View>

      {/* Action Buttons */}
      <View className="mt-xl flex-row gap-md">
        <View className="flex-1">
          <Button variant="primary" block onPress={handleStartSession}>
            Start session
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="ghost" block onPress={() => router.push(`/clients/${client.id}`)}>
            Open profile
          </Button>
        </View>
      </View>
      <View className="mt-md flex-row gap-md">
        <View className="flex-1">
          <Button variant="quiet" block onPress={() => router.push('/appointments')}>
            Book appointment
          </Button>
        </View>
        <View className="flex-1">
          <Button variant="quiet" block onPress={() => router.push('/more/second-sight')}>
            Second Sight
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

// --- List State Components ---
function ListLoadingState() {
  return (
    <View className="flex-1 py-xl px-lg">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-center gap-[12px] px-lg py-[12px] min-h-[72px]">
          <View className="w-[44px] h-[44px] rounded-full bg-skeleton-bg" />
          <View className="flex-1 gap-sm">
            <View className="w-[140px] h-[14px] rounded-sm bg-skeleton-bg" />
            <View className="w-[200px] h-[12px] rounded-sm bg-skeleton-bg" />
          </View>
        </View>
      ))}
    </View>
  );
}

function ListErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      <Text className="text-body-md text-text-primary font-medium mb-xs">
        Failed to load clients
      </Text>
      <Text className="text-body-sm text-text-muted text-center mb-lg">
        Check your connection and try again
      </Text>
      <Button variant="primary" size="sm" onPress={onRetry}>
        Retry
      </Button>
    </View>
  );
}

function ListEmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      <User size={40} color="rgba(29,31,33,0.18)" />
      <Text className="text-body-md text-text-primary font-medium mt-md text-center">
        {searchQuery ? `No results for "${searchQuery}"` : 'No clients yet'}
      </Text>
      <Text className="text-body-sm text-text-muted text-center mt-xs">
        {searchQuery ? 'Try adjusting your search terms' : 'Create your first client to get started'}
      </Text>
    </View>
  );
}

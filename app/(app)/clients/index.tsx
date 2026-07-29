import { View, Text, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  DollarSign, 
  Calendar,
  AlertCircle,
  UserX,
  FileX,
  Stethoscope,
  Play
} from 'lucide-react-native';

import { useClients } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import type { Client, ClientSearchParams } from '@/src/api/clients.types';

// --- Types ---
type FilterType = 'all' | 'recent' | 'vip' | 'cult' | 'vault' | 'incomplete';

// --- Main Screen ---
export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build search params based on active filter
  const searchParams = useMemo((): ClientSearchParams | undefined => {
    const params: ClientSearchParams = { limit: 50 };
    
    if (debouncedQuery) {
      params.q = debouncedQuery;
    }
    
    switch (activeFilter) {
      case 'recent':
        params.sort = 'updatedAt';
        params.limit = 20;
        break;
      case 'vip':
        params.tag = 'member-vip';
        break;
      case 'cult':
        params.tag = 'member-cult';
        break;
      case 'vault':
        params.tag = 'member-vault';
        break;
      case 'incomplete':
        // This would need backend support - for now just show all
        break;
    }
    
    return Object.keys(params).length > 1 ? params : undefined;
  }, [debouncedQuery, activeFilter]);

  // Fetch clients
  const { data, isLoading, error, refetch } = useClients(searchParams);
  const clients = data?.clients ?? [];
  const total = data?.total ?? 0;

  // Find selected client
  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  // Render client row
  const renderClientRow = useCallback(({ item }: { item: Client }) => (
    <ClientRow
      client={item}
      isSelected={selectedClientId === item.id}
      onPress={() => setSelectedClientId(item.id)}
    />
  ), [selectedClientId]);

  return (
    <View className="flex-1 bg-bg-page">
      {/* TopBar */}
      <View className="px-2xl pt-2xl pb-lg border-b border-border">
        <View className="flex-row items-center justify-between">
          <Text className="text-display-lg text-text-primary">Clients</Text>
          <Text className="text-caption-md text-text-muted">{total} total</Text>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Panel - 40% */}
        <View className="w-[40%] border-r border-border">
          {/* Search */}
          <View className="p-md border-b border-border">
            <View className="flex-row items-center bg-bg-surface border border-border rounded-md px-md min-h-[44px]">
              <Search color="#737373" size={16} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search clients..."
                placeholderTextColor="#737373"
                className="flex-1 ml-sm text-body-lg text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Filter Pills */}
          <View className="px-md py-sm border-b border-border">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-sm">
                <FilterPill
                  label="All"
                  active={activeFilter === 'all'}
                  onPress={() => setActiveFilter('all')}
                />
                <FilterPill
                  label="Recent"
                  active={activeFilter === 'recent'}
                  onPress={() => setActiveFilter('recent')}
                />
                <FilterPill
                  label="VIP"
                  active={activeFilter === 'vip'}
                  onPress={() => setActiveFilter('vip')}
                />
                <FilterPill
                  label="CULT"
                  active={activeFilter === 'cult'}
                  onPress={() => setActiveFilter('cult')}
                />
                <FilterPill
                  label="VAULT"
                  active={activeFilter === 'vault'}
                  onPress={() => setActiveFilter('vault')}
                />
                <FilterPill
                  label="Incomplete"
                  active={activeFilter === 'incomplete'}
                  onPress={() => setActiveFilter('incomplete')}
                />
              </View>
            </ScrollView>
          </View>

          {/* Client List */}
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : clients.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={renderClientRow}
              showsVerticalScrollIndicator={false}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}
        </View>

        {/* Right Panel - 60% */}
        <View className="flex-1">
          {selectedClient ? (
            <ClientPreview client={selectedClient} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <User color="#D4D4D4" size={64} />
              <Text className="text-body-lg text-text-muted mt-lg">
                Select a client to preview
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// --- Client Row Component ---
interface ClientRowProps {
  client: Client;
  isSelected: boolean;
  onPress: () => void;
}

function ClientRow({ client, isSelected, onPress }: ClientRowProps) {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  // Format relative timestamp
  const lastActivity = new Date(client.updatedAt);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  let activityText = '';
  if (diffInDays === 0) {
    activityText = 'Today';
  } else if (diffInDays === 1) {
    activityText = 'Yesterday';
  } else if (diffInDays < 7) {
    activityText = `${diffInDays}d`;
  } else if (diffInDays < 30) {
    activityText = `${Math.floor(diffInDays / 7)}w`;
  } else {
    activityText = lastActivity.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select ${name}, last activity ${activityText}`}
      className={`
        flex-row items-center p-md min-h-[60px]
        ${isSelected ? 'bg-bg-surface border-l-[3px] border-l-brand' : 'bg-bg-page'}
      `}
    >
      {/* Avatar */}
      <View className="w-[44px] h-[44px] rounded-full bg-brand items-center justify-center mr-md">
        <Text className="text-brand-text text-body-sm font-medium">{initials}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 min-w-0">
        <Text className="text-text-primary text-body-lg font-medium" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-text-muted text-body-sm" numberOfLines={1}>
          {client.email || 'No email'}
        </Text>
      </View>

      {/* Timestamp */}
      <Text className="text-text-muted text-caption-md">
        {activityText}
      </Text>
    </Pressable>
  );
}

// --- Client Preview Component ---
interface ClientPreviewProps {
  client: Client;
}

function ClientPreview({ client }: ClientPreviewProps) {
  const router = useRouter();
  const { startSession } = useSessionStore();
  const { mode: privacyMode } = usePrivacyStore();
  
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  // Extract tier from tags
  const tierTag = (client.tags ?? []).find((t) => t.startsWith('member-'));
  const tier = tierTag ? tierTag.replace('member-', '').toUpperCase() : null;

  // Check if client is active (has recent activity)
  const lastActivity = new Date(client.updatedAt);
  const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = daysSinceActivity < 90;

  // Format currency (hide in client mode unless explicitly shown)
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    if (privacyMode === 'client') return 'Tap to view';
    return `$${amount.toLocaleString()}`;
  };

  // Format last visit
  const formatLastVisit = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffInDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Profile gaps - mock data for demo (would come from enrichment API)
  const profileGaps = useMemo(() => {
    const gaps = [];
    if (!client.phone) gaps.push('No phone number');
    if ((client.tags ?? []).length === 0) gaps.push('No tags');
    // These would come from enrichment data in real implementation
    gaps.push('No Rx on file', 'No fit measurements');
    return gaps;
  }, [client]);

  const handleStartSession = () => {
    startSession(client.id, name);
    router.push(`/clients/${client.id}/session`);
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32 }}>
      {/* Header */}
      <View className="flex-row items-center mb-xl">
        {/* Avatar */}
        <View className="w-[72px] h-[72px] rounded-full bg-brand items-center justify-center mr-lg">
          <Text className="text-brand-text text-display-sm font-medium">{initials}</Text>
        </View>

        {/* Name + contact */}
        <View className="flex-1">
          <Text className="text-display-md text-text-primary mb-xs">{name}</Text>
          <View className="flex-row items-center gap-lg">
            {client.email && (
              <View className="flex-row items-center">
                <Mail color="#737373" size={16} />
                <Text className="text-text-muted text-body-md ml-xs" numberOfLines={1}>
                  {client.email}
                </Text>
              </View>
            )}
            {client.phone && (
              <View className="flex-row items-center">
                <Phone color="#737373" size={16} />
                <Text className="text-text-muted text-body-md ml-xs">
                  {client.phone}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Badges */}
        <View className="flex-col gap-sm">
          {tier && (
            <View className="bg-brand rounded-md px-md py-xs">
              <Text className="text-brand-text text-caption-lg font-medium">{tier}</Text>
            </View>
          )}
          {isActive && (
            <View className="bg-success rounded-md px-md py-xs">
              <Text className="text-white text-caption-lg font-medium">Active</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Card */}
      <View className="bg-bg-surface border border-border rounded-lg p-lg mb-lg">
        <View className="flex-row">
          {/* Orders */}
          <View className="flex-1 items-center">
            <View className="flex-row items-center mb-xs">
              <ShoppingBag color="#737373" size={20} />
              <Text className="text-display-sm text-text-primary ml-xs font-medium">
                {client.orderCount ?? 0}
              </Text>
            </View>
            <Text className="text-text-muted text-caption-lg">Orders</Text>
          </View>

          {/* Divider */}
          <View className="w-px bg-border mx-lg" />

          {/* LTV */}
          <View className="flex-1 items-center">
            <View className="flex-row items-center mb-xs">
              <DollarSign color="#737373" size={20} />
              <Text className="text-display-sm text-text-primary ml-xs font-medium">
                {formatCurrency(client.totalSpent)}
              </Text>
            </View>
            <Text className="text-text-muted text-caption-lg">LTV</Text>
          </View>

          {/* Divider */}
          <View className="w-px bg-border mx-lg" />

          {/* Last Visit */}
          <View className="flex-1 items-center">
            <View className="flex-row items-center mb-xs">
              <Calendar color="#737373" size={20} />
              <Text className="text-body-sm text-text-primary ml-xs font-medium">
                {formatLastVisit(client.updatedAt)}
              </Text>
            </View>
            <Text className="text-text-muted text-caption-lg">Last visit</Text>
          </View>
        </View>
      </View>

      {/* Profile Gaps Card */}
      {profileGaps.length > 0 && (
        <View className="bg-bg-surface border border-border rounded-lg p-lg mb-lg">
          <View className="flex-row items-center mb-md">
            <AlertCircle color="#CA8A04" size={20} />
            <Text className="text-text-primary text-heading-sm ml-xs font-medium">
              Profile gaps
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-sm">
            {profileGaps.map((gap, index) => (
              <View key={index} className="bg-bg-muted rounded-md px-sm py-xs">
                <Text className="text-text-muted text-caption-lg">{gap}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="gap-md">
        {/* Primary Action */}
        <Pressable
          onPress={handleStartSession}
          className="bg-brand rounded-md px-lg py-md min-h-[44px] items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={`Start session with ${name}`}
        >
          <View className="flex-row items-center">
            <Play color="#FFFFFF" size={20} />
            <Text className="text-brand-text text-body-lg font-medium ml-xs">
              Start session
            </Text>
          </View>
        </Pressable>

        {/* Secondary Actions */}
        <View className="flex-row gap-md">
          <Pressable
            onPress={() => router.push(`/clients/${client.id}`)}
            className="flex-1 bg-bg-surface border border-border rounded-md px-lg py-md min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Open profile for ${name}`}
          >
            <Text className="text-text-primary text-body-lg font-medium">
              Open profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/appointments')}
            className="flex-1 bg-bg-surface border border-border rounded-md px-lg py-md min-h-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={`Book appointment for ${name}`}
          >
            <Text className="text-text-primary text-body-lg font-medium">
              Book appointment
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// --- Filter Pill Component ---
interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`
        px-md py-xs rounded-full min-h-[32px] items-center justify-center
        ${active 
          ? 'bg-brand' 
          : 'bg-bg-surface border border-border'
        }
      `}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label}${active ? ', currently active' : ''}`}
    >
      <Text className={`
        text-caption-lg font-medium
        ${active ? 'text-brand-text' : 'text-text-primary'}
      `}>
        {label}
      </Text>
    </Pressable>
  );
}

// --- State Components ---
function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center py-xl">
      <View className="w-8 h-8 rounded-full bg-color-skeleton-bg animate-pulse mb-md" />
      <View className="w-24 h-4 rounded bg-color-skeleton-bg animate-pulse" />
    </View>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      <UserX color="#DC2626" size={48} />
      <Text className="text-text-primary text-body-lg font-medium mt-md mb-xs text-center">
        Failed to load clients
      </Text>
      <Text className="text-text-muted text-body-md text-center mb-lg">
        Check your connection and try again
      </Text>
      <Pressable
        onPress={onRetry}
        className="bg-brand rounded-md px-lg py-sm min-h-[44px] items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Retry loading clients"
      >
        <Text className="text-brand-text text-body-md font-medium">
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

interface EmptyStateProps {
  searchQuery: string;
}

function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      {searchQuery ? (
        <>
          <FileX color="#D4D4D4" size={48} />
          <Text className="text-text-primary text-body-lg font-medium mt-md text-center">
            No results for "{searchQuery}"
          </Text>
          <Text className="text-text-muted text-body-md text-center">
            Try adjusting your search terms
          </Text>
        </>
      ) : (
        <>
          <User color="#D4D4D4" size={48} />
          <Text className="text-text-primary text-body-lg font-medium mt-md text-center">
            No clients yet
          </Text>
          <Text className="text-text-muted text-body-md text-center">
            Create your first client to get started
          </Text>
        </>
      )}
    </View>
  );
}
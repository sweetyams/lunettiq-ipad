import { View, Text, FlatList, TextInput, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { User, Search, UserPlus, Plus, Play, CalendarPlus } from 'lucide-react-native';

import { useClients } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar } from '@/src/ui/Avatar';
import { Badge, Button, FilterChips, ListRow, PageHeader, Section, StatRow, formatPhone, kitColors } from '@/src/ui/kit';
import type { Client, ClientSearchParams } from '@/src/api/clients.types';
import { useLayout, useKeyboard } from '@/src/ui/layout';
import { useT, type TKey } from '@/src/i18n';

// --- Types ---
type FilterType = 'all' | 'recent' | 'cult' | 'vault' | 'incomplete';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'clients.all' },
  { key: 'recent', label: 'clients.recent' },
  { key: 'cult', label: 'CULT' },
  { key: 'vault', label: 'VAULT' },
  { key: 'incomplete', label: 'clients.incomplete' },
];

// --- Main Screen ---
export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const layout = useLayout();
  const keyboard = useKeyboard();
  const tr = useT();
  // CULT/VAULT are brand names; the rest are dictionary keys.
  const filters = FILTERS.map((f) => ({ ...f, label: f.label.includes('.') ? tr(f.label as TKey) : f.label }));
  // Portrait 11": one column, rows open the profile. Otherwise list + preview.
  const twoPane = layout.twoPane;

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
        isSelected={twoPane && selectedClientId === item.id}
        onPress={() => (twoPane ? setSelectedClientId(item.id) : router.push(`/clients/${item.id}`))}
      />
    ),
    [selectedClientId, twoPane, router],
  );

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={tr('clients.title')}
        subtitle={tr(total === 1 ? 'clients.countOne' : 'clients.countMany', { count: total.toLocaleString() })}
        actions={<Button label={tr('clients.newClient')} icon={UserPlus} onPress={() => router.push('/clients/new')} />}
      />

      <View className="flex-1 flex-row">
        {/* List */}
        <View className={twoPane ? 'border-r border-border' : 'flex-1'} style={twoPane ? { width: layout.listWidth } : undefined}>
          <View className="px-[20px] pt-[16px] pb-[12px] gap-[12px]">
            <View className="flex-row items-center bg-bg-page border border-border rounded-md px-[12px] min-h-[44px]">
              <Search size={18} color={kitColors.iconMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={tr('clients.searchPlaceholder')}
                placeholderTextColor={kitColors.textTertiary}
                className="flex-1 ml-[8px] text-body-md text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => { const first = clients[0]; if (first) router.push(`/clients/${first.id}`); }}
                accessibilityLabel="Search clients"
              />
            </View>
            {/* Filters give way to results while the keyboard is up. */}
            {keyboard.visible ? null : <FilterChips<FilterType> value={activeFilter} onChange={setActiveFilter} options={filters} />}
          </View>

          <View className="flex-1">
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
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: keyboard.visible ? keyboard.height + 24 : 140 }}
              />
            )}
          </View>
        </View>

        {/* Preview */}
        {twoPane ? <View className="flex-1">
          {selectedClient ? (
            <ClientPreview client={selectedClient} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <User size={40} color={kitColors.iconMuted} />
              <Text className="text-body-md text-text-tertiary mt-[12px]">{tr('clients.selectToPreview')}</Text>
            </View>
          )}
        </View> : null}
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
  const tr = useT();
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ');
  const hasCultTag = (client.tags ?? []).some((t) => t === 'member-cult');
  const hasVaultTag = (client.tags ?? []).some((t) => t === 'member-vault');

  // Relative time
  const activityText = useMemo(() => {
    const diff = Math.floor((Date.now() - new Date(client.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return tr('floor.today');
    if (diff === 1) return tr('floor.yesterday');
    if (diff < 7) return `${diff}d`;
    return new Date(client.updatedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  }, [client.updatedAt]);

  const tier = hasCultTag ? 'CULT' : hasVaultTag ? 'VAULT' : null;
  return (
    <ListRow
      selected={isSelected}
      onPress={onPress}
      accessibilityLabel={tr('clients.lastActivityA11y', { name: name || tr('clients.noName'), when: activityText })}
      leading={<Avatar firstName={client.firstName} lastName={client.lastName} size="md" />}
      title={
        <View className="flex-row items-center gap-[8px]">
          <Text className={`text-body-md text-text-primary ${name ? 'font-medium' : 'text-text-tertiary'}`} numberOfLines={1}>
            {name || tr('clients.noName')}
          </Text>
          {tier ? <Badge tone="info">{tier}</Badge> : null}
        </View>
      }
      subtitle={client.email || tr('clients.noEmail')}
      trailing={<Text className="text-body-sm text-text-tertiary">{activityText}</Text>}
    />
  );
}

// --- Client Preview Panel ---
interface ClientPreviewProps {
  client: Client;
}

function ClientPreview({ client }: ClientPreviewProps) {
  const tr = useT();
  const router = useRouter();
  const { startSession } = useSessionStore();
  const privacyMode = usePrivacyStore((s) => s.mode);

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || tr('clients.noName');

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
    if (diff === 0) return tr('floor.today');
    if (diff === 1) return tr('floor.yesterday');
    if (diff < 30) return tr('clients.daysAgo', { count: diff });
    return new Date(dateStr).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' });
  };

  // Contact summary line
  const contactParts = [client.email, formatPhone(client.phone) || tr('clients.noPhone')].filter(Boolean);


  const handleStartSession = useCallback(() => {
    startSession(client.id, name);
    router.push(`/clients/${client.id}/session`);
  }, [client.id, name, startSession, router]);


  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 40, paddingBottom: 140, gap: 24 }} showsVerticalScrollIndicator={false}>
      {/* Identity */}
      <View className="flex-row items-center gap-[20px]">
        <Avatar firstName={client.firstName} lastName={client.lastName} size="lg" />
        <View className="flex-1">
          <View className="flex-row items-center gap-[10px]">
            <Text className="text-display-md text-text-primary" numberOfLines={1}>{name}</Text>
            {tier ? <Badge tone="info">{tier}</Badge> : null}
            {isActive ? <Badge tone="success" dot>{tr('clients.active')}</Badge> : null}
          </View>
          <Text className="text-body-md text-text-tertiary mt-[4px]" numberOfLines={1}>{contactParts.join(' · ')}</Text>
        </View>
      </View>

      <StatRow
        stats={[
          { value: String(client.orderCount ?? 0), label: tr('clients.orders') },
          { value: formatCurrency(client.totalSpent), label: tr('clients.lifetimeValue') },
          { value: formatLastVisit(client.updatedAt), label: tr('clients.lastActivity') },
        ]}
      />


      <View className="flex-row gap-[12px]">
        <Button label={tr('clients.startVisit')} icon={Play} variant="primary" size="lg" onPress={handleStartSession} />
        <Button label={tr('clients.openProfile')} size="lg" onPress={() => router.push(`/clients/${client.id}`)} />
        <Button label={tr('clients.bookAppointment')} icon={CalendarPlus} variant="ghost" size="lg" onPress={() => router.push(`/appointments?book=${client.id}`)} />
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
  const tr = useT();
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      <Text className="text-body-md text-text-primary font-medium mb-xs">
        {tr('clients.loadFailed')}
      </Text>
      <Text className="text-body-sm text-text-tertiary text-center mb-lg">
        {tr('clients.checkConnection')}
      </Text>
      <Button label={tr('clients.tryAgain')} size="sm" onPress={onRetry} />
    </View>
  );
}

function ListEmptyState({ searchQuery }: { searchQuery: string }) {
  const tr = useT();
  return (
    <View className="flex-1 items-center justify-center py-xl px-lg">
      <User size={40} color={kitColors.iconMuted} />
      <Text className="text-body-md text-text-primary font-medium mt-md text-center">
        {searchQuery ? tr('clients.noResults', { q: searchQuery }) : tr('clients.noClients')}
      </Text>
      <Text className="text-body-sm text-text-muted text-center mt-xs">
        {searchQuery ? tr('clients.adjustSearch') : tr('clients.createFirst')}
      </Text>
    </View>
  );
}

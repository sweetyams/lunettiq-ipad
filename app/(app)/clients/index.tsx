import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Mail, Phone, ShoppingBag, Tag, ArrowLeft, MessageCircle, Calendar, User, FileText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '@/src/api/client';
import { useSessionStore } from '@/src/features/session/useSessionStore';

// --- Types ---
interface Client {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpent: number | null;
  orderCount: number | null;
  tags: string[] | null;
  status: string;
  updatedAt: string;
  createdAt: string;
}

// --- Screen ---
export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'profile' | 'history'>('profile');
  const router = useRouter();
  const { setClient } = useSessionStore();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch clients
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clients', debouncedQuery],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (debouncedQuery) params.q = debouncedQuery;
      const result = await api.get<{ clients: Client[]; total: number }>('/api/clients', { params });
      return result;
    },
    staleTime: 60_000,
  });

  const clients = data?.clients ?? [];

  const relativeTime = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const renderRow = useCallback(({ item }: { item: Client }) => {
    const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unknown';
    const initials = [item.firstName?.[0], item.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
    const isSelected = selectedClient?.id === item.id;

    return (
      <Pressable
        onPress={() => {
          setSelectedClient(item);
          setViewMode('profile'); // Reset to profile view when selecting a new client
        }}
        className={`px-md py-md border-b border-border flex-row items-center ${isSelected ? 'bg-bg-surface' : ''}`}
      >
        <View className="w-10 h-10 rounded-full bg-brand items-center justify-center mr-md">
          <Text className="text-brand-text text-caption font-medium">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-bodyStrong text-text-primary">{name}</Text>
          <Text className="text-caption text-text-muted">{item.email || 'No email'}</Text>
        </View>
        <Text className="text-caption text-text-muted">{relativeTime(item.updatedAt)}</Text>
      </Pressable>
    );
  }, [selectedClient?.id]);

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border flex-row items-end justify-between">
        <Text className="text-displayLg text-text-primary">Clients</Text>
        {data && <Text className="text-caption text-text-muted">{data.total} total</Text>}
      </View>

      <View className="flex-1 flex-row">
        {/* Left — List */}
        <View className="w-[380px] border-r border-border">
          {/* Search */}
          <View className="p-md border-b border-border">
            <View className="flex-row items-center bg-bg-surface border border-border rounded-lg px-md h-[44px]">
              <Search color="#A3A3A3" size={16} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search clients..."
                placeholderTextColor="#A3A3A3"
                className="flex-1 ml-sm text-body text-text-primary"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* List */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#1A1A1A" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center p-xl">
              <Text className="text-body text-text-muted mb-md">Failed to load clients</Text>
              <Pressable onPress={() => refetch()} className="bg-brand rounded-lg px-lg py-sm min-h-[44px] items-center justify-center">
                <Text className="text-brand-text text-bodyStrong">Retry</Text>
              </Pressable>
            </View>
          ) : clients.length === 0 ? (
            <View className="flex-1 items-center justify-center p-xl">
              <Users color="#D4D4D4" size={32} />
              <Text className="text-body text-text-muted mt-md text-center">
                {searchQuery ? 'No results' : 'No clients'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Right — Profile or History */}
        <View className="flex-1">
          {selectedClient ? (
            viewMode === 'profile' ? (
              <ClientProfile 
                client={selectedClient} 
                onStartSession={() => {
                  setClient(selectedClient.id);
                  router.push(`/clients/${selectedClient.id}/session`);
                }}
                onViewHistory={() => setViewMode('history')}
              />
            ) : (
              <ClientHistory 
                client={selectedClient} 
                onBack={() => setViewMode('profile')}
              />
            )
          ) : (
            <View className="flex-1 items-center justify-center">
              <Users color="#D4D4D4" size={48} />
              <Text className="text-body text-text-muted mt-md">Select a client to view their profile</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// --- Client Profile Panel ---
function ClientProfile({ 
  client, 
  onStartSession, 
  onViewHistory 
}: { 
  client: Client; 
  onStartSession: () => void;
  onViewHistory: () => void;
}) {
  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  const initials = [client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const tags = client.tags ?? [];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32 }}>
      {/* Header */}
      <View className="flex-row items-center mb-xl">
        <View className="w-16 h-16 rounded-full bg-brand items-center justify-center mr-lg">
          <Text className="text-brand-text text-headline">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-displayMd text-text-primary">{name}</Text>
          {client.email && <Text className="text-body text-text-muted">{client.email}</Text>}
        </View>
        {client.status && (
          <View className="bg-bg-surface border border-border rounded-full px-md py-xs">
            <Text className="text-captionStrong text-text-primary">{client.status}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View className="flex-row gap-md mb-xl">
        <View className="flex-1 bg-bg-surface border border-border rounded-lg p-md items-center">
          <ShoppingBag color="#737373" size={20} />
          <Text className="text-displayMd text-text-primary mt-sm">{client.orderCount ?? 0}</Text>
          <Text className="text-caption text-text-muted">Orders</Text>
        </View>
        <View className="flex-1 bg-bg-surface border border-border rounded-lg p-md items-center">
          <Text className="text-displayMd text-text-primary">{formatCurrency(client.totalSpent)}</Text>
          <Text className="text-caption text-text-muted">Total Spent</Text>
        </View>
      </View>

      {/* Contact */}
      <View className="border border-border rounded-lg mb-md">
        <Text className="text-captionStrong text-text-muted uppercase px-md pt-md pb-sm">Contact</Text>
        <Row label="Email" value={client.email} />
        <Row label="Phone" value={client.phone} />
      </View>

      {/* Tags */}
      {tags.length > 0 && (
        <View className="border border-border rounded-lg mb-md p-md">
          <Text className="text-captionStrong text-text-muted uppercase mb-sm">Tags</Text>
          <View className="flex-row flex-wrap gap-sm">
            {tags.map((tag) => (
              <View key={tag} className="bg-bg-surface border border-border rounded-full px-md py-xs">
                <Text className="text-caption text-text-primary">{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-md mt-lg">
        <Pressable 
          onPress={onStartSession}
          className="flex-1 bg-brand rounded-lg py-md items-center min-h-[44px] justify-center"
        >
          <Text className="text-brand-text text-bodyStrong">Start Session</Text>
        </Pressable>
        <Pressable 
          onPress={onViewHistory}
          className="flex-1 bg-bg-surface border border-border rounded-lg py-md items-center min-h-[44px] justify-center"
        >
          <Text className="text-text-primary text-bodyStrong">View History</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// --- Client History Panel ---
interface Interaction {
  id: string;
  type: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  staffName: string | null;
  occurredAt: string;
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  source: string;
  total: number | null;
  createdAt: string;
}

function ClientHistory({ client, onBack }: { client: Client; onBack: () => void }) {
  const { data: interactions, isLoading: interactionsLoading, error: interactionsError } = useQuery({
    queryKey: ['clients', client.id, 'interactions'],
    queryFn: () => api.get<Interaction[]>(`/api/clients/${client.id}/interactions`, { 
      params: { limit: '50' } 
    }),
    staleTime: 60_000,
  });

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['clients', client.id, 'orders'],
    queryFn: () => api.get<Order[]>(`/api/clients/${client.id}/orders`),
    staleTime: 60_000,
  });

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'note': return <MessageCircle color="#737373" size={16} />;
      case 'call': return <Phone color="#737373" size={16} />;
      case 'visit': return <User color="#737373" size={16} />;
      case 'email': return <Mail color="#737373" size={16} />;
      case 'fitting': 
      case 'session': return <Users color="#737373" size={16} />;
      default: return <FileText color="#737373" size={16} />;
    }
  };

  // Combine and sort interactions and orders by date
  const allItems = [
    ...(interactions || []).map(i => ({ ...i, itemType: 'interaction' as const })),
    ...(orders || []).map(o => ({ ...o, itemType: 'order' as const, occurredAt: o.createdAt }))
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const isLoading = interactionsLoading || ordersLoading;
  const hasError = interactionsError || ordersError;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 32 }}>
      {/* Header */}
      <View className="flex-row items-center mb-xl">
        <Pressable 
          onPress={onBack}
          className="mr-md p-sm rounded-lg bg-bg-surface border border-border min-w-[44px] min-h-[44px] items-center justify-center"
        >
          <ArrowLeft color="#1A1A1A" size={20} />
        </Pressable>
        <Text className="text-displayMd text-text-primary flex-1">{name} History</Text>
      </View>

      {/* Loading state */}
      {isLoading && (
        <View className="flex-1 items-center justify-center py-xl">
          <ActivityIndicator color="#1A1A1A" />
        </View>
      )}

      {/* Error state */}
      {hasError && (
        <View className="flex-1 items-center justify-center py-xl">
          <Text className="text-body text-text-muted">Failed to load history</Text>
        </View>
      )}

      {/* Timeline */}
      {!isLoading && !hasError && (
        <>
          {allItems.length === 0 ? (
            <View className="flex-1 items-center justify-center py-xl">
              <Calendar color="#D4D4D4" size={32} />
              <Text className="text-body text-text-muted mt-md">No history yet</Text>
            </View>
          ) : (
            <View className="space-y-md">
              {allItems.map((item) => (
                <View key={`${item.itemType}-${item.id}`} className="border border-border rounded-lg p-md">
                  <View className="flex-row items-start gap-md">
                    <View className="mt-xs">
                      {item.itemType === 'interaction' ? 
                        getInteractionIcon((item as any).type) : 
                        <ShoppingBag color="#737373" size={16} />
                      }
                    </View>
                    <View className="flex-1">
                      {item.itemType === 'interaction' ? (
                        <>
                          <View className="flex-row items-center justify-between mb-xs">
                            <Text className="text-bodyStrong text-text-primary capitalize">
                              {(item as any).type}
                            </Text>
                            <Text className="text-caption text-text-muted">
                              {formatDate(item.occurredAt)}
                            </Text>
                          </View>
                          {(item as any).subject && (
                            <Text className="text-body text-text-primary mb-xs">
                              {(item as any).subject}
                            </Text>
                          )}
                          {(item as any).body && (
                            <Text className="text-body text-text-muted">
                              {(item as any).body}
                            </Text>
                          )}
                          {(item as any).staffName && (
                            <Text className="text-caption text-text-muted mt-xs">
                              by {(item as any).staffName}
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <View className="flex-row items-center justify-between mb-xs">
                            <Text className="text-bodyStrong text-text-primary">
                              Order {(item as any).orderNumber || `#${item.id.slice(-6)}`}
                            </Text>
                            <Text className="text-caption text-text-muted">
                              {formatDate(item.occurredAt)}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-body text-text-muted">
                              {(item as any).status} • {(item as any).source}
                            </Text>
                            <Text className="text-bodyStrong text-text-primary">
                              {formatCurrency((item as any).total)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// --- Simple row component ---
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="flex-row items-center px-md py-md border-b border-border">
      <Text className="text-body text-text-muted flex-1">{label}</Text>
      <Text className="text-bodyStrong text-text-primary">{value || '—'}</Text>
    </View>
  );
}

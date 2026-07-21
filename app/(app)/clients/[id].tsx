import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  User, Eye, Palette, Plus, Lightbulb, ChevronLeft, ClipboardList, Award, Users2,
} from 'lucide-react-native';
import { useClient, useUpdateClient } from '@/src/api/useClients';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { LoadingState, ErrorState, EmptyState, PermissionGate } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';
import {
  ProfileHeader,
  EnrichmentPanel,
  PreferencesPanel,
  InteractionsTimeline,
  InlineEditField,
  OrdersPanel,
  PrescriptionsPanel,
  WishlistPanel,
  SegmentsPanel,
  ProductInteractionsPanel,
  TryonSessionsPanel,
  LinksPanel,
  LoyaltyPanel,
  ReceiptsPanel,
} from '@/src/features/client-profile';
import type { ClientProfile, ClientUpdateParams } from '@/src/api/clients.types';

type ProfileTab = 'overview' | 'history' | 'clinical' | 'relationships';

const TABS: Array<{ key: ProfileTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'history', label: 'History' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'relationships', label: 'Relationships' },
];

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: client, isLoading, error, refetch } = useClient(id!);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error="Failed to load client" onRetry={refetch} />;
  if (!client) return <EmptyState message="Client not found" />;

  return <ClientProfileLayout client={client} />;
}

function ClientProfileLayout({ client }: { client: ClientProfile }) {
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const startSession = useSessionStore((s) => s.startSession);
  const updateClient = useUpdateClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const name = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';

  const handleStartSession = useCallback(() => {
    startSession(client.id, name);
    router.push(`/clients/${client.id}/session`);
  }, [client.id, name, router, startSession]);

  const handleUpdateField = useCallback(
    (field: keyof ClientUpdateParams, value: string) => {
      const data: ClientUpdateParams = { [field]: value || null };
      updateClient.mutate(
        { id: client.id, data },
        {
          onSuccess: () => toast.success('Updated'),
          onError: () => toast.error('Failed to update'),
        }
      );
    },
    [client.id, updateClient]
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header with client info */}
      <ProfileHeader client={client} onStartSession={handleStartSession} />

      {/* Tab bar */}
      <View className="bg-bg-elevated border-b border-border px-2xl">
        <View className="flex-row">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`min-h-[44px] px-lg items-center justify-center border-b-2 ${
                activeTab === tab.key ? 'border-brand' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
              accessibilityLabel={tab.label}
            >
              <Text
                className={`text-bodyStrong ${
                  activeTab === tab.key ? 'text-brand' : 'text-text-muted'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Main content area: scrollable left + action sidebar right */}
      <View className="flex-1 flex-row">
        {/* Scrollable content */}
        <ScrollView className="flex-1 p-xl" showsVerticalScrollIndicator={false}>
          <View className="max-w-4xl">
            {activeTab === 'overview' && (
              <OverviewTab client={client} onUpdateField={handleUpdateField} />
            )}
            {activeTab === 'history' && <HistoryTab clientId={client.id} />}
            {activeTab === 'clinical' && <ClinicalTab clientId={client.id} />}
            {activeTab === 'relationships' && <RelationshipsTab clientId={client.id} />}
          </View>
        </ScrollView>

        {/* Right action sidebar */}
        <View className="w-44 bg-bg-elevated border-l border-border p-lg">
          <ActionButton
            icon={<User color="#FFFFFF" size={20} />}
            label="Start Session"
            variant="primary"
            onPress={handleStartSession}
          />
          <ActionButton
            icon={<Eye color="#2B2B2B" size={20} />}
            label="Second Sight"
            variant="secondary"
            onPress={() => router.push(`/more/second-sight?clientId=${client.id}`)}
          />
          <ActionButton
            icon={<Palette color="#2B2B2B" size={20} />}
            label="Custom Design"
            variant="secondary"
            onPress={() => router.push(`/more/custom-design?clientId=${client.id}`)}
          />
          <PermissionGate permission="org:rx-pipeline:read">
            <ActionButton
              icon={<ClipboardList color="#2B2B2B" size={20} />}
              label="Rx Pipeline"
              variant="secondary"
              onPress={() => router.push(`/more/rx-pipeline?clientId=${client.id}`)}
            />
          </PermissionGate>
          <PermissionGate permission="org:multi_pair:recommend">
            <ActionButton
              icon={<Users2 color="#2B2B2B" size={20} />}
              label="Multi-Pair"
              variant="secondary"
              onPress={() => router.push(`/clients/${client.id}/session`)}
            />
          </PermissionGate>
          <ActionButton
            icon={<Lightbulb color="#2B2B2B" size={20} />}
            label="AI Stylist"
            variant="secondary"
            onPress={() => {/* TODO: AI Stylist modal */}}
          />
          {privacyMode === 'staff' && (
            <ActionButton
              icon={<Plus color="#2B2B2B" size={20} />}
              label="Add Note"
              variant="secondary"
              onPress={() => setActiveTab('history')}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Tab Content ─────────────────────────────────────────────

function OverviewTab({
  client,
  onUpdateField,
}: {
  client: ClientProfile;
  onUpdateField: (field: keyof ClientUpdateParams, value: string) => void;
}) {
  const privacyMode = usePrivacyStore((s) => s.mode);

  return (
    <View className="gap-lg">
      {/* Contact Details — editable */}
      <View className="bg-bg-elevated rounded-lg border border-border p-md">
        <Text className="text-bodyStrong text-text-primary mb-md">Contact Details</Text>
        <InlineEditField
          label="First name"
          value={client.firstName}
          onSave={(v) => onUpdateField('firstName', v)}
        />
        <InlineEditField
          label="Last name"
          value={client.lastName}
          onSave={(v) => onUpdateField('lastName', v)}
        />
        <InlineEditField
          label="Email"
          value={client.email}
          onSave={(v) => onUpdateField('email', v)}
          keyboardType="email-address"
        />
        <InlineEditField
          label="Phone"
          value={client.phone}
          onSave={(v) => onUpdateField('phone', v)}
          keyboardType="phone-pad"
        />
        {privacyMode === 'staff' && (
          <View className="mt-sm pt-sm border-t border-border">
            <View className="flex-row items-center">
              <Text className="text-body text-text-muted w-32">Tags</Text>
              <View className="flex-1 flex-row flex-wrap gap-xs">
                {client.tags.map((tag) => (
                  <View key={tag} className="bg-bg-page px-sm py-xs rounded-md">
                    <Text className="text-caption text-text-primary">{tag}</Text>
                  </View>
                ))}
                {client.tags.length === 0 && (
                  <Text className="text-body text-text-muted italic">No tags</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Fit Profile / Enrichment */}
      <EnrichmentPanel clientId={client.id} />

      {/* Preferences */}
      <PreferencesPanel clientId={client.id} />

      {/* Loyalty credits — staff only */}
      <LoyaltyPanel clientId={client.id} />

      {/* Insurance receipts */}
      <ReceiptsPanel clientId={client.id} />

      {/* Wishlist */}
      <WishlistPanel clientId={client.id} />
    </View>
  );
}

function HistoryTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  return (
    <View className="gap-lg">
      <InteractionsTimeline clientId={clientId} />
      <OrdersPanel clientId={clientId} />
      <PermissionGate permission="org:rx-pipeline:read">
        <Pressable
          onPress={() => router.push(`/more/rx-pipeline?clientId=${clientId}`)}
          className="flex-row items-center justify-between bg-bg-surface border border-border rounded-lg px-lg py-md min-h-[44px]"
        >
          <Text className="text-body text-navy">View Rx Pipeline orders →</Text>
        </Pressable>
      </PermissionGate>
      <TryonSessionsPanel clientId={clientId} />
      <ProductInteractionsPanel clientId={clientId} />
    </View>
  );
}

function ClinicalTab({ clientId }: { clientId: string }) {
  return (
    <View className="gap-lg">
      <PrescriptionsPanel clientId={clientId} />
      <EnrichmentPanel clientId={clientId} />
    </View>
  );
}

function RelationshipsTab({ clientId }: { clientId: string }) {
  return (
    <View className="gap-lg">
      <LinksPanel clientId={clientId} />
      <SegmentsPanel clientId={clientId} />
    </View>
  );
}

// ─── Action Button ───────────────────────────────────────────

function ActionButton({
  icon,
  label,
  variant,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[44px] w-full rounded-md p-md flex-col items-center justify-center mb-md ${
        variant === 'primary' ? 'bg-accent' : 'bg-border'
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text
        className={`text-captionStrong mt-xs text-center ${
          variant === 'primary' ? 'text-text-inverse' : 'text-text-primary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useClient, useUpdateClient, useClientEnrichment, useUpdateEnrichment, useClientPreferences, useUpdatePreferences, useClientWishlist, useClientSegments } from '@/src/api/useClients';
import { ProfileSectionCard, ProfileEditModal, EnrichmentPanel, PreferencesPanel, InteractionsTimeline, OrdersPanel, PrescriptionsPanel, WishlistPanel, SegmentsPanel, TryonSessionsPanel, LinksPanel, LoyaltyPanel, QuickStats, RxStatus, InsuranceSummary, LifestyleSummary, MultiPairCTA, InsuranceFormSheet, LifestyleQuestionnaireSheet, MultiPairResultsSheet, PrescriptionSheet } from '@/src/features/client-profile';
import type { FieldDef } from '@/src/features/client-profile';
import type { ClientProfile } from '@/src/api/clients.types';
import { LoadingState, ErrorState, EmptyState, Button } from '@/src/ui';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { ChevronLeft, Calendar, Clock, CreditCard, Settings2, Eye, Heart } from 'lucide-react-native';

type TabType = 'overview' | 'clinical' | 'history' | 'relationships';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { startSession, mode: sessionMode, activeClientId: sessionClientId } = useSessionStore();
  const isSessionActive = sessionMode !== 'idle';
  const isThisClientInSession = isSessionActive && sessionClientId === id;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInsuranceSheet, setShowInsuranceSheet] = useState(false);
  const [showLifestyleSheet, setShowLifestyleSheet] = useState(false);
  const [showMultiPairSheet, setShowMultiPairSheet] = useState(false);
  const [showPrescriptionSheet, setShowPrescriptionSheet] = useState(false);

  // Data hooks
  const { data: client, isLoading, error, refetch } = useClient(id);
  
  const handleStartSession = useCallback(() => {
    if (client) {
      const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown Client';
      startSession(client.id, clientName);
      router.push(`/clients/${client.id}/session`);
    }
  }, [client, startSession, router]);

  const handleSecondSight = useCallback(() => {
    router.push(`/more/second-sight?clientId=${id}`);
  }, [router, id]);

  const handleCustomDesign = useCallback(() => {
    router.push(`/more/custom-design?clientId=${id}`);
  }, [router, id]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!client) return <EmptyState message="Client not found" />;

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown Client';
  const availableTabs: TabType[] = privacyMode === 'client' 
    ? ['overview'] 
    : ['overview', 'clinical', 'history', 'relationships'];

  return (
    <View className="flex-1 bg-bg-page">
      {/* TopBar */}
      <View className="bg-bg-surface border-b border-border px-lg py-md flex-row items-center justify-between">
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="min-w-[44px] min-h-[44px] items-center justify-center -ml-sm"
          hitSlop={8}
        >
          <ChevronLeft size={24} color="rgb(64,64,64)" />
        </Pressable>

        {/* Client Name */}
        <Text className="text-heading-md text-text-primary flex-1 text-center mx-md">
          {clientName}
        </Text>

        {/* Actions — context-aware based on session state */}
        <View className="flex-row gap-sm">
          {isSessionActive && isThisClientInSession ? (
            /* Session active for THIS client — show session nav actions */
            <>
              <Pressable
                onPress={() => router.push(`/clients/${id}/session`)}
                className="bg-brand rounded-md px-lg py-sm min-h-[44px] justify-center"
                hitSlop={4}
              >
                <Text className="text-brand-text text-body-md font-semibold">
                  Go to Session
                </Text>
              </Pressable>
            </>
          ) : isSessionActive ? (
            /* Session active for a DIFFERENT client — show muted state */
            <View className="border border-border rounded-md px-md py-sm min-h-[44px] justify-center opacity-50">
              <Text className="text-text-muted text-body-sm">
                Session active with another client
              </Text>
            </View>
          ) : (
            /* No session — show full action set */
            <>
              <Pressable
                onPress={handleStartSession}
                className="bg-brand rounded-md px-lg py-sm min-h-[44px] justify-center"
                hitSlop={4}
              >
                <Text className="text-brand-text text-body-md font-semibold">
                  Start Session
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSecondSight}
                className="border border-border rounded-md px-md py-sm min-h-[44px] justify-center"
                hitSlop={4}
              >
                <Text className="text-text-primary text-body-md">
                  Second Sight
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCustomDesign}
                className="border border-border rounded-md px-md py-sm min-h-[44px] justify-center"
                hitSlop={4}
              >
                <Text className="text-text-primary text-body-md">
                  Custom Design
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Main Layout */}
      <View className="flex-1 flex-row">
        {/* Fixed Left Rail - 300px */}
        <View className="w-[300px] bg-bg-surface border-r border-border">
          <ScrollView className="flex-1 p-lg">
            {/* Identity */}
            <View className="items-center mb-lg">
              <View className="w-[72px] h-[72px] rounded-full bg-bg-muted items-center justify-center mb-sm">
                <Text className="text-heading-lg text-text-secondary font-medium">
                  {[client.firstName?.[0], client.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                </Text>
              </View>
              <Text className="text-heading-md text-text-primary text-center font-medium">
                {clientName}
              </Text>
              {client.email && (
                <Text className="text-body-sm text-text-muted mt-xs text-center">
                  {client.email}
                </Text>
              )}
              {client.phone && (
                <Text className="text-body-sm text-text-muted text-center">
                  {client.phone}
                </Text>
              )}
              
              {/* Badges */}
              <View className="flex-row gap-xs mt-sm">
                {client.status === "active" && (
                  <View className="bg-success px-sm py-xs rounded-md">
                    <Text className="text-white text-caption-md font-medium">
                      Active
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Separator */}
            <View className="h-px bg-border mb-lg" />

            {/* Quick Stats */}
            <QuickStats client={client} />

            {/* Separator */}
            <View className="h-px bg-border my-lg" />

            {/* Loyalty */}
            <LoyaltyPanel clientId={client.id} />

            {/* Separator */}
            <View className="h-px bg-border my-lg" />

            {/* Rx Status */}
            <RxStatus clientId={client.id} />
          </ScrollView>
        </View>

        {/* Right Content Area */}
        <View className="flex-1">
          {/* Tab Bar */}
          <View className="bg-bg-surface border-b border-border">
            <View className="flex-row px-lg">
              {availableTabs.map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="py-md mr-xl min-h-[44px] justify-center"
                  style={{ minWidth: 100 }} // Fixed width to prevent text jumping
                  hitSlop={8}
                >
                  <View className="items-center">
                    <Text 
                      className={`text-heading-sm capitalize ${
                        activeTab === tab 
                          ? 'text-text-primary font-semibold' 
                          : 'text-text-muted font-normal'
                      }`}
                    >
                      {tab}
                    </Text>
                    {activeTab === tab && (
                      <View className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-brand rounded-full" />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tab Content */}
          <ScrollView 
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
            }
          >
            {activeTab === 'overview' && (
              <OverviewTab 
                clientId={client.id} 
                client={client}
                onOpenSheet={(sheet: string) => {
                  if (sheet === 'insurance') setShowInsuranceSheet(true);
                  if (sheet === 'lifestyle') setShowLifestyleSheet(true);
                  if (sheet === 'multipair') setShowMultiPairSheet(true);
                  if (sheet === 'prescription') setShowPrescriptionSheet(true);
                }}
              />
            )}

            {activeTab === 'clinical' && privacyMode === 'staff' && (
              <ClinicalTab clientId={client.id} />
            )}

            {activeTab === 'history' && privacyMode === 'staff' && (
              <HistoryTab clientId={client.id} />
            )}

            {activeTab === 'relationships' && privacyMode === 'staff' && (
              <RelationshipsTab clientId={client.id} />
            )}
          </ScrollView>
        </View>
      </View>

      {/* Sheets */}
      {showInsuranceSheet && (
        <InsuranceFormSheet
          visible={showInsuranceSheet}
          onClose={() => setShowInsuranceSheet(false)}
          clientId={client.id}
        />
      )}
      
      {showLifestyleSheet && (
        <LifestyleQuestionnaireSheet
          visible={showLifestyleSheet}
          onClose={() => setShowLifestyleSheet(false)}
          clientId={client.id}
        />
      )}
      
      {showMultiPairSheet && (
        <MultiPairResultsSheet
          visible={showMultiPairSheet}
          onClose={() => setShowMultiPairSheet(false)}
          clientId={client.id}
        />
      )}
      
      {showPrescriptionSheet && (
        <PrescriptionSheet
          visible={showPrescriptionSheet}
          onClose={() => setShowPrescriptionSheet(false)}
          clientId={client.id}
        />
      )}
    </View>
  );
}

// Tab Components

function OverviewTab({ clientId, client, onOpenSheet }: { 
  clientId: string; 
  client: ClientProfile;
  onOpenSheet: (sheet: string) => void;
}) {
  const { data: enrichment } = useClientEnrichment(clientId);
  const { data: preferences } = useClientPreferences(clientId);
  const { data: wishlist } = useClientWishlist(clientId);
  const { data: segments } = useClientSegments(clientId);
  const updateClient = useUpdateClient();
  const updateEnrichment = useUpdateEnrichment();
  const updatePreferences = useUpdatePreferences();
  const privacyMode = usePrivacyStore((s) => s.mode);

  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Contact fields
  const contactFields: FieldDef[] = [
    { key: 'firstName', label: 'First name', type: 'text', required: true, half: true },
    { key: 'lastName', label: 'Last name', type: 'text', required: true, half: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'phone' },
  ];

  // Fit profile fields
  const fitFields: FieldDef[] = [
    { key: 'faceShape', label: 'Face shape', type: 'select', options: ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'] },
    { key: 'frameWidthMm', label: 'Frame width', type: 'number', suffix: 'mm', half: true },
    { key: 'bridgeWidthMm', label: 'Bridge width', type: 'number', suffix: 'mm', half: true },
  ];

  // Preferences fields
  const prefFields: FieldDef[] = [
    { key: 'shapes', label: 'Shapes', type: 'chips', options: ['rectangular', 'square', 'round', 'cat-eye', 'aviator', 'geometric', 'oval'] },
    { key: 'materials', label: 'Materials', type: 'chips', options: ['acetate', 'titanium', 'steel', 'combination', 'wood', 'horn'] },
    { key: 'colours', label: 'Colours', type: 'chips', options: ['tortoise', 'black', 'crystal', 'bold colour', 'metallic', 'gold', 'silver'] },
    { key: 'brandsAdmired', label: 'Brands', type: 'chips', options: ['CHIMI', 'Kaleos', 'Jimmy Fairly', 'Lexxola', 'Moscot', 'Garrett Leight'] },
    { key: 'avoid', label: 'Avoid', type: 'chips', inverted: true, options: ['round', 'rimless', 'heavy', 'flashy', 'oversized'] },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Style notes' },
  ];

  // Data processing
  const hasFitData = !!(enrichment?.faceShape || enrichment?.frameWidthMm);
  const hasPrefs = !!(preferences?.stated?.shapes?.length || preferences?.stated?.materials?.length);
  const hasWishlist = wishlist && wishlist.length > 0;
  const hasTagsOrSegments = (client.tags?.length || 0) > 0 || (segments && segments.length > 0);

  // Save handlers
  const handleSaveContact = async (values: Record<string, string>) => {
    await updateClient.mutateAsync({ id: clientId, data: values });
  };

  const handleSaveFit = async (values: Record<string, string>) => {
    await updateEnrichment.mutateAsync({
      clientId,
      data: {
        faceShape: values.faceShape || null,
        frameWidthMm: values.frameWidthMm ? Number(values.frameWidthMm) : null,
        bridgeWidthMm: values.bridgeWidthMm ? Number(values.bridgeWidthMm) : null,
      },
    });
  };

  const handleSavePrefs = async (values: Record<string, string>) => {
    await updatePreferences.mutateAsync({
      clientId,
      data: {
        shapes: values.shapes ? values.shapes.split(',') : [],
        materials: values.materials ? values.materials.split(',') : [],
        colours: values.colours ? values.colours.split(',') : [],
        brandsAdmired: values.brandsAdmired ? values.brandsAdmired.split(',') : [],
        avoid: values.avoid ? values.avoid.split(',') : [],
        notes: values.notes || '',
      },
    });
  };

  const handleSaveNotes = async (values: Record<string, string>) => {
    await updateEnrichment.mutateAsync({ 
      clientId, 
      data: { internalNotes: values.internalNotes || null } 
    });
  };

  return (
    <>
      <View className="p-lg gap-lg">
        {/* 1. Contact */}
        <ProfileSectionCard
          title="Contact"
          actionLabel="Edit"
          onAction={() => setEditingSection('contact')}
          rows={[
            { label: 'First name', value: client.firstName },
            { label: 'Last name', value: client.lastName },
            { label: 'Email', value: client.email },
            { label: 'Phone', value: client.phone },
          ]}
        />

        {/* 2. Fit Profile */}
        <ProfileSectionCard
          title="Fit Profile"
          actionLabel={hasFitData ? "Edit" : "Add"}
          onAction={() => setEditingSection('fit')}
          isEmpty={!hasFitData}
          emptyMessage="No measurements taken yet."
          emptyCta="Add measurements"
          rows={hasFitData ? [
            { label: 'Face shape', value: enrichment?.faceShape },
            { label: 'Frame width', value: enrichment?.frameWidthMm?.toString(), suffix: ' mm' },
            { label: 'Bridge width', value: enrichment?.bridgeWidthMm?.toString(), suffix: ' mm' },
          ] : undefined}
        />

        {/* 3. Preferences */}
        <ProfileSectionCard
          title="Preferences"
          actionLabel={hasPrefs ? "Edit" : "Add"}
          onAction={() => setEditingSection('preferences')}
          isEmpty={!hasPrefs}
          emptyMessage="No style preferences recorded yet."
          emptyCta="Add preferences"
          chips={hasPrefs ? [
            { label: 'Shapes', values: preferences?.stated?.shapes || [] },
            { label: 'Materials', values: preferences?.stated?.materials || [] },
            { label: 'Colours', values: preferences?.stated?.colours || [] },
            { label: 'Brands', values: preferences?.stated?.brandsAdmired || [] },
            { label: 'Avoid', values: preferences?.stated?.avoid || [], inverted: true },
          ] : undefined}
        />

        {/* 4. Insurance */}
        <ProfileSectionCard
          title="Insurance"
          actionLabel="Add"
          onAction={() => onOpenSheet('insurance')}
          isEmpty
          emptyMessage="No insurance on file. Add to unlock multi-pair coverage calculations."
          emptyCta="Add insurance"
        />

        {/* 5. Lifestyle */}
        <ProfileSectionCard
          title="Lifestyle"
          actionLabel="Fill"
          onAction={() => onOpenSheet('lifestyle')}
          isEmpty
          emptyMessage="Questionnaire not filled. Unlocks better recommendations."
          emptyCta="Fill questionnaire — 2 min"
        />

        {/* 6. Wishlist */}
        <ProfileSectionCard
          title="Wishlist"
          actionLabel={hasWishlist ? 'View All' : 'Browse'}
          onAction={() => {/* Navigate to wishlist or products */}}
          isEmpty={!hasWishlist}
          emptyMessage="No items in wishlist."
          emptyCta="Browse products"
        >
          {hasWishlist && (
            <View className="flex-row flex-wrap gap-sm">
              {wishlist!.slice(0, 6).map((item, index) => (
                <View key={item.id || index} className="w-[80px] h-[60px] bg-bg-muted rounded-md items-center justify-center">
                  <Heart size={16} color="rgb(115, 115, 115)" />
                  <Text className="text-caption-sm text-text-muted mt-xs text-center" numberOfLines={1}>
                    {item.product?.title?.split(' ')[0] || 'Item'}
                  </Text>
                </View>
              ))}
              {wishlist!.length > 6 && (
                <View className="w-[80px] h-[60px] bg-bg-muted rounded-md items-center justify-center">
                  <Text className="text-caption-md text-text-muted">
                    +{wishlist!.length - 6}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ProfileSectionCard>

        {/* 7. Multi-pair Suggestions */}
        <ProfileSectionCard
          title="Multi-pair Suggestions"
          actionLabel="Generate"
          onAction={() => onOpenSheet('multipair')}
          isEmpty
          emptyMessage="AI recommendations for complete eyewear wardrobe."
          emptyCta="Generate suggestions"
        />

        {/* 8. Tags & Segments (Staff Only) */}
        {privacyMode === 'staff' && (
          <ProfileSectionCard
            title="Tags & Segments"
            actionLabel="Manage"
            onAction={() => {/* Open tag management */}}
            staffOnly
            isEmpty={!hasTagsOrSegments}
            emptyMessage="No tags or segment memberships."
            emptyCta="Add tags"
          >
            {hasTagsOrSegments && (
              <View className="gap-sm">
                {client.tags && client.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-xs">
                    {client.tags.map(tag => (
                      <View key={tag} className="px-sm py-xs bg-bg-muted rounded-md">
                        <Text className="text-caption-md text-text-primary">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {segments && segments.length > 0 && (
                  <View className="flex-row flex-wrap gap-xs">
                    {segments.map(seg => (
                      <View key={seg.id} className="px-sm py-xs bg-brand/10 rounded-md">
                        <Text className="text-caption-md text-brand">
                          {typeof seg.name === 'string' ? seg.name : seg.name?.en || 'Segment'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ProfileSectionCard>
        )}

        {/* 9. Internal Notes (Staff Only) */}
        {privacyMode === 'staff' && (
          <ProfileSectionCard
            title="Internal Notes"
            actionLabel={enrichment?.internalNotes ? "Edit" : "Add"}
            onAction={() => setEditingSection('notes')}
            staffOnly
            isEmpty={!enrichment?.internalNotes}
            emptyMessage="No notes yet."
            emptyCta="Add note"
          >
            {enrichment?.internalNotes && (
              <Text className="text-body-sm text-text-primary">
                {enrichment.internalNotes}
              </Text>
            )}
          </ProfileSectionCard>
        )}
      </View>

      {/* Edit Modals */}
      <ProfileEditModal
        title="Edit Contact"
        visible={editingSection === 'contact'}
        onClose={() => setEditingSection(null)}
        fields={contactFields}
        initialValues={{
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email || '',
          phone: client.phone || '',
        }}
        onSave={handleSaveContact}
        saving={updateClient.isPending}
      />

      <ProfileEditModal
        title="Edit Fit Profile"
        subtitle="Measurements for frame recommendations"
        visible={editingSection === 'fit'}
        onClose={() => setEditingSection(null)}
        fields={fitFields}
        initialValues={{
          faceShape: enrichment?.faceShape || '',
          frameWidthMm: enrichment?.frameWidthMm?.toString() || '',
          bridgeWidthMm: enrichment?.bridgeWidthMm?.toString() || '',
        }}
        onSave={handleSaveFit}
        saving={updateEnrichment.isPending}
      />

      <ProfileEditModal
        title="Edit Preferences"
        subtitle="Style likes, dislikes, and notes"
        visible={editingSection === 'preferences'}
        onClose={() => setEditingSection(null)}
        fields={prefFields}
        initialValues={{
          shapes: (preferences?.stated?.shapes || []).join(','),
          materials: (preferences?.stated?.materials || []).join(','),
          colours: (preferences?.stated?.colours || []).join(','),
          brandsAdmired: (preferences?.stated?.brandsAdmired || []).join(','),
          avoid: (preferences?.stated?.avoid || []).join(','),
          notes: preferences?.stated?.notes || '',
        }}
        onSave={handleSavePrefs}
        saving={updatePreferences.isPending}
      />

      <ProfileEditModal
        title="Internal Notes"
        visible={editingSection === 'notes'}
        onClose={() => setEditingSection(null)}
        fields={[{ key: 'internalNotes', label: 'Notes', type: 'textarea', placeholder: 'Internal notes about this client' }]}
        initialValues={{ internalNotes: enrichment?.internalNotes || '' }}
        onSave={handleSaveNotes}
        saving={updateEnrichment.isPending}
      />
    </>
  );
}

function ClinicalTab({ clientId }: { clientId: string }) {
  return (
    <View className="p-lg gap-lg">
      <PrescriptionsPanel clientId={clientId} />
      <EnrichmentPanel clientId={clientId} />
    </View>
  );
}

function HistoryTab({ clientId }: { clientId: string }) {
  const [filter, setFilter] = useState<string>('all');
  
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'orders', label: 'Orders' },
    { key: 'tryons', label: 'Try-ons' },
    { key: 'notes', label: 'Notes' },
    { key: 'visits', label: 'Visits' },
  ];

  return (
    <View className="p-lg gap-lg">
      {/* Filter Pills */}
      <View className="flex-row gap-sm items-center">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-sm">
            {filters.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-md py-sm rounded-full min-h-[44px] justify-center ${
                  filter === f.key 
                    ? 'bg-brand' 
                    : 'bg-bg-muted'
                }`}
                hitSlop={4}
              >
                <Text className={`text-body-sm ${
                  filter === f.key 
                    ? 'text-brand-text font-medium' 
                    : 'text-text-secondary'
                }`}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        
        <Button
          variant="ghost"
          onPress={() => {/* Open add note modal */}}
        >
          + Add note
        </Button>
      </View>

      <InteractionsTimeline clientId={clientId} />
      <OrdersPanel clientId={clientId} />
      <TryonSessionsPanel clientId={clientId} />
    </View>
  );
}

function RelationshipsTab({ clientId }: { clientId: string }) {
  return (
    <View className="p-lg gap-lg">
      <LinksPanel clientId={clientId} />
      <SegmentsPanel clientId={clientId} />
    </View>
  );
}
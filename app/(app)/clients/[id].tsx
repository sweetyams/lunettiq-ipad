import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { useClient } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar, Button, Chip, Tag, RowKV, LoadingState, ErrorState, EmptyState } from '@/src/ui';
import { InsuranceFormSheet, LifestyleQuestionnaireSheet, MultiPairResultsSheet, PrescriptionSheet } from '@/src/features/client-profile';
import { OverviewTab } from '@/src/features/client-profile/tabs/OverviewTab';
import { ClinicalTab } from '@/src/features/client-profile/tabs/ClinicalTab';
import { HistoryTab } from '@/src/features/client-profile/tabs/HistoryTab';
import { RelationshipsTab } from '@/src/features/client-profile/tabs/RelationshipsTab';

type TabType = 'overview' | 'clinical' | 'history' | 'relationships';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'history', label: 'History' },
  { key: 'relationships', label: 'Relationships' },
];

export default function ClientProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { startSession, mode: sessionMode, activeClientId } = useSessionStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInsuranceSheet, setShowInsuranceSheet] = useState(false);
  const [showLifestyleSheet, setShowLifestyleSheet] = useState(false);
  const [showMultiPairSheet, setShowMultiPairSheet] = useState(false);
  const [showPrescriptionSheet, setShowPrescriptionSheet] = useState(false);

  // Data
  const { data: client, isLoading, error, refetch } = useClient(id);

  // Derived
  const clientName = useMemo(() => {
    if (!client) return '';
    return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unknown';
  }, [client]);

  const tierTag = useMemo(() => {
    const tag = (client?.tags ?? []).find((t) => t.startsWith('member-'));
    return tag?.replace('member-', '').toUpperCase() ?? null;
  }, [client?.tags]);

  const tierVariant = tierTag === 'CULT' ? 'cult' as const : tierTag === 'VAULT' ? 'vault' as const : 'default' as const;

  // Handlers
  const handleStartSession = useCallback(() => {
    if (!client) return;
    startSession(client.id, clientName);
    router.push(`/clients/${client.id}/session`);
  }, [client, clientName, startSession, router]);

  const handleOpenSheet = useCallback((sheet: string) => {
    if (sheet === 'insurance') setShowInsuranceSheet(true);
    if (sheet === 'lifestyle') setShowLifestyleSheet(true);
    if (sheet === 'multipair') setShowMultiPairSheet(true);
    if (sheet === 'prescription') setShowPrescriptionSheet(true);
  }, []);

  // Tabs available based on privacy mode
  const availableTabs = privacyMode === 'client' ? TABS.slice(0, 1) : TABS;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!client) return <EmptyState message="Client not found" />;

  return (
    <View className="flex-1 bg-bg-page">
      {/* TopBar */}
      <View className="flex-row items-center justify-between px-lg py-md border-b border-border">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center min-h-[44px] gap-xs"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={20} color="#1D1F21" />
          <Text className="text-heading-md text-text-primary">{clientName}</Text>
        </Pressable>
        <View className="flex-row gap-md items-center">
          <Chip label="Staff view ▾" />
          <Chip label="⋯" />
        </View>
      </View>

      {/* Split: Rail + Content */}
      <View className="flex-1 flex-row">
        {/* Fixed Left Rail — 328px */}
        <View className="w-[328px] border-r border-border flex-col">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Identity */}
            <View className="p-lg border-b border-border">
              <Avatar firstName={client.firstName} lastName={client.lastName} size="lg" />
              <Text className="text-heading-sm font-medium text-text-primary mt-[14px]">
                {clientName}
              </Text>
              <Text className="text-body-sm text-text-muted">{client.email || 'No email'}</Text>
              <View className="flex-row gap-[6px] mt-[10px]">
                {tierTag && <Tag label={tierTag} variant={tierVariant} />}
                {client.status === 'active' && <Tag label="Active" variant="ok" />}
              </View>
            </View>

            {/* Quick Stats */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-[10px]">
                Quick stats
              </Text>
              <RowKV label="Orders" value={String(client.orderCount ?? 0)} mono />
              <RowKV label="Lifetime value" value={formatCurrency(client.totalSpent)} mono />
              <RowKV label="Average order" value={client.orderCount ? formatCurrency((client.totalSpent ?? 0) / client.orderCount) : '—'} mono />
              <RowKV label="Member since" value={formatDate(client.createdAt)} mono />
              <RowKV label="Last visit" value={formatDate(client.updatedAt)} mono isLast />
            </View>

            {/* Loyalty */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-[10px]">
                Loyalty
              </Text>
              <RowKV label="Credits" value="$0.00" mono />
              <RowKV label="Next tier" value={tierTag === 'CULT' ? 'VAULT' : 'CULT'} isLast />
            </View>

            {/* Prescription */}
            <View className="px-lg py-md border-b border-border">
              <Text className="text-caption-md tracking-widest uppercase text-text-muted mb-[10px]">
                Prescription
              </Text>
              <Text className="text-body-sm text-text-muted">
                None on file · <Text className="text-brand font-medium" onPress={() => setActiveTab('clinical')}>add in Clinical</Text>
              </Text>
            </View>
          </ScrollView>

          {/* Pinned Actions */}
          <View className="px-lg py-md border-t border-border gap-sm bg-bg-surface">
            <Button variant="primary" block onPress={handleStartSession}>
              Start session
            </Button>
            <Button variant="ghost" block onPress={() => router.push(`/more/second-sight?clientId=${id}`)}>
              Second Sight intake
            </Button>
            <Button variant="quiet" block onPress={() => router.push(`/more/custom-design?clientId=${id}`)}>
              Custom design
            </Button>
          </View>
        </View>

        {/* Right Content */}
        <View className="flex-1 flex-col">
          {/* Tab Bar */}
          <View className="flex-row gap-lg px-lg border-b border-border">
            {availableTabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="py-[14px]"
                hitSlop={8}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
              >
                <Text
                  className={`text-body-md ${
                    activeTab === tab.key
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted'
                  }`}
                >
                  {tab.label}
                </Text>
                {activeTab === tab.key && (
                  <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView className="flex-1" contentContainerClassName="p-lg">
            {activeTab === 'overview' && (
              <OverviewTab
                clientId={client.id}
                client={client}
                onOpenSheet={handleOpenSheet}
                onEditSection={() => {}}
              />
            )}
            {activeTab === 'clinical' && privacyMode === 'staff' && (
              <ClinicalTab clientId={client.id} onAddPrescription={() => setShowPrescriptionSheet(true)} />
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
        <InsuranceFormSheet visible={showInsuranceSheet} onClose={() => setShowInsuranceSheet(false)} clientId={client.id} />
      )}
      {showLifestyleSheet && (
        <LifestyleQuestionnaireSheet visible={showLifestyleSheet} onClose={() => setShowLifestyleSheet(false)} clientId={client.id} />
      )}
      {showMultiPairSheet && (
        <MultiPairResultsSheet visible={showMultiPairSheet} onClose={() => setShowMultiPairSheet(false)} clientId={client.id} />
      )}
      {showPrescriptionSheet && (
        <PrescriptionSheet visible={showPrescriptionSheet} onClose={() => setShowPrescriptionSheet(false)} clientId={client.id} />
      )}
    </View>
  );
}

// --- Utilities ---

function formatCurrency(amount: number | null): string {
  if (!amount) return '$0.00';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

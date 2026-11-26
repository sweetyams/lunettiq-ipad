import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, CalendarPlus } from 'lucide-react-native';

import { useClient } from '@/src/api/useClients';
import { usePrescriptions } from '@/src/api/usePrescriptions';
import { useClientUpcoming } from '@/src/api/useAppointments';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { toast } from '@/src/ui/useToastStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { Avatar } from '@/src/ui/Avatar';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import {
  Badge, Button, KeyValue, Section, Tabs, kitColors, formatDate, formatDollars, formatPhone,
} from '@/src/ui/kit';
import {
  InsuranceFormSheet, LifestyleQuestionnaireSheet, MultiPairResultsSheet, PrescriptionSheet, ContactEditSheet,
  NotesEditSheet, FitProfileEditSheet, ClinicalNotesSheet, AddNoteSheet, PreferencesSheet, TagManagementSheet,
  LinkClientSheet,
} from '@/src/features/client-profile';
import { OverviewTab, type ProfileSheet } from '@/src/features/client-profile/tabs/OverviewTab';
import { ClinicalTab } from '@/src/features/client-profile/tabs/ClinicalTab';
import { HistoryTab } from '@/src/features/client-profile/tabs/HistoryTab';
import { RelationshipsTab } from '@/src/features/client-profile/tabs/RelationshipsTab';
import { rxStatus, rxTypeLabel } from '@/src/features/client-profile/tabs/rxFormat';
import { useLayout } from '@/src/ui/layout';
import { handoffLine, readHandoff } from '@/src/features/client-profile/clientFile';
import { useLangStore } from '@/src/i18n';

type TabType = 'overview' | 'clinical' | 'history' | 'relationships';

const TABS: { key: TabType; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinical', label: 'Clinical' },
  { key: 'history', label: 'History' },
  { key: 'relationships', label: 'Relationships' },
];

type Sheet = ProfileSheet | 'prescription' | 'fit' | 'clinical-notes' | 'add-note' | 'link';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { startSession } = useSessionStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const close = useCallback(() => setSheet(null), []);
  const layout = useLayout();
  const lang = useLangStore((st) => st.uiLang);

  const { data: client, isLoading, error, refetch } = useClient(id);
  const { data: prescriptions } = usePrescriptions({ clientId: id });
  const { data: upcoming } = useClientUpcoming(id);

  const clientName = useMemo(() => {
    if (!client) return '';
    return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'No name yet';
  }, [client]);

  const tier = useMemo(() => {
    const tag = (client?.tags ?? []).find((t) => t.startsWith('member-'));
    return tag ? tag.replace('member-', '').toUpperCase() : null;
  }, [client?.tags]);

  const latestRx = prescriptions?.[0]; // newest first
  const nextVisit = upcoming?.[0];

  const handleStartSession = useCallback(() => {
    if (!client) return;
    // A visit for someone else is open: say so (startSession silently refused and the screen
    // landed on "No visit in progress"). The same client's visit just reopens.
    const { mode: m, activeClientId: open, activeClientName: openName } = useSessionStore.getState();
    if (m !== 'idle' && open !== client.id) {
      toast.warning('Another visit is open', `End ${openName ?? 'that'} visit before starting a new one.`);
      return;
    }
    startSession(client.id, clientName);
    router.push(`/clients/${client.id}/session`);
  }, [client, clientName, startSession, router]);

  const staff = privacyMode === 'staff';
  const availableTabs = staff ? TABS : TABS.slice(0, 1);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!client) return <EmptyState message="Client not found" />;

  const phone = formatPhone(client.phone);
  const contactLine = [client.email, phone].filter(Boolean).join(' · ') || 'No email or phone yet';
  const rxBadge = latestRx ? rxStatus(latestRx) : null;
  const comingBack = handoffLine(readHandoff(client.enrichment?.customFields), lang);

  const railSections = (
    <>
        <Section title="Summary">
          <KeyValue
            mono
            rows={[
              { label: 'Orders', value: String(client.orderCount ?? 0) },
              { label: 'Lifetime value', value: formatDollars(client.totalSpent) },
              { label: 'Average order', value: client.orderCount ? formatDollars(Math.round(((client.totalSpent ?? 0) / client.orderCount) * 100) / 100) : null },
              { label: 'Client since', value: formatDate(client.createdAt) },
            ]}
          />
        </Section>

        <Section
          title="Prescription"
          action={{ label: latestRx ? 'View' : 'Add', onPress: () => (latestRx ? setActiveTab('clinical') : setSheet('prescription')) }}
        >
          {latestRx && rxBadge ? (
            <View className="gap-[8px]">
              <Text className="text-body-md font-medium text-text-primary">
                {latestRx.prescribedAt ? `Exam ${formatDate(latestRx.prescribedAt)}` : rxTypeLabel(latestRx)}
              </Text>
              {latestRx.prescribedBy || latestRx.clinicName ? (
                <Text className="text-body-sm text-text-tertiary">{[latestRx.prescribedBy, latestRx.clinicName].filter(Boolean).join(' · ')}</Text>
              ) : null}
              <View className="flex-row">
                <Badge tone={rxBadge.tone} dot={rxBadge.tone !== 'neutral'}>{rxBadge.label}</Badge>
              </View>
            </View>
          ) : (
            <Text className="text-body-sm text-text-tertiary">None on file.</Text>
          )}
        </Section>

        <Section title="Next visit" action={{ label: 'Book', onPress: () => router.push(`/appointments?book=${client.id}`) }}>
          {nextVisit ? (
            <View className="gap-[4px]">
              <Text className="text-body-md font-medium text-text-primary">{nextVisit.type}</Text>
              <Text className="text-body-sm text-text-tertiary">
                {new Date(nextVisit.startsAt).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {nextVisit.staffName ? ` · ${nextVisit.staffName}` : ''}
              </Text>
            </View>
          ) : (
            <Text className="text-body-sm text-text-tertiary">Nothing booked.</Text>
          )}
        </Section>
    </>
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-[32px] pt-[16px] pb-[20px] bg-bg-page">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start min-h-[44px] gap-[4px] -ml-[6px]"
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to clients"
        >
          <ChevronLeft size={20} color={kitColors.textTertiary} />
          <Text className="text-body-md text-text-tertiary">Clients</Text>
        </Pressable>
        <View className="flex-row items-center gap-[20px] mt-[8px]">
          <Avatar firstName={client.firstName ?? ''} lastName={client.lastName ?? ''} size="lg" />
          <View className="flex-1">
            <View className="flex-row items-center gap-[12px]">
              <Text className="text-display-lg text-text-primary flex-shrink" numberOfLines={1}>{clientName}</Text>
              {tier ? <Badge tone="info">{tier}</Badge> : null}
              {client.status === 'active' ? <Badge tone="success" dot>Active</Badge> : null}
            </View>
            <Text className="text-body-md text-text-tertiary mt-[4px]" numberOfLines={1}>{contactLine}</Text>
            {staff && comingBack ? (
              <Text className="text-body-md text-info mt-[2px]" numberOfLines={1}>{`${lang === 'fr' ? 'Revient pour' : 'Coming back for'}: ${comingBack}`}</Text>
            ) : null}
          </View>
          <View className="flex-row items-center gap-[8px]">
            {staff ? <Button label="Book" icon={CalendarPlus} variant="ghost" onPress={() => router.push(`/appointments?book=${client.id}`)} /> : null}
            <Button label="Start visit" icon={Play} variant="primary" onPress={handleStartSession} />
          </View>
        </View>
      </View>

      <Tabs<TabType> value={activeTab} onChange={setActiveTab} options={availableTabs} />

      <View className="flex-1 flex-row">
        {/* Inspector rail (beside the tabs when there's room; on top of Overview in portrait 11") */}
        {staff && layout.twoPane ? (
          <ScrollView
            className="flex-grow-0 border-r border-border"
            style={{ width: layout.size === 'wide' ? 320 : 280 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {railSections}
          </ScrollView>
        ) : null}

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 140 }}>
          {activeTab === 'overview' && staff && !layout.twoPane ? (
            <View className="gap-[20px] mb-[24px]">{railSections}</View>
          ) : null}
          {activeTab === 'overview' && (
            <OverviewTab clientId={client.id} client={client} onOpenSheet={setSheet} />
          )}
          {activeTab === 'clinical' && staff && (
            <ClinicalTab
              clientId={client.id}
              onAddPrescription={() => setSheet('prescription')}
              onEditFit={() => setSheet('fit')}
              onAddClinicalNote={() => setSheet('clinical-notes')}
            />
          )}
          {activeTab === 'history' && staff && (
            <HistoryTab clientId={client.id} onAddNote={() => setSheet('add-note')} />
          )}
          {activeTab === 'relationships' && staff && (
            <RelationshipsTab clientId={client.id} onLinkClient={() => setSheet('link')} onOpenClient={(cid) => router.push(`/clients/${cid}`)} />
          )}
        </ScrollView>
      </View>

      {/* Sheets */}
      {sheet === 'insurance' && <InsuranceFormSheet visible onClose={close} clientId={client.id} />}
      {sheet === 'lifestyle' && <LifestyleQuestionnaireSheet visible onClose={close} clientId={client.id} />}
      {sheet === 'multipair' && <MultiPairResultsSheet visible onClose={close} clientId={client.id} />}
      {sheet === 'prescription' && <PrescriptionSheet visible onClose={close} clientId={client.id} />}
      {sheet === 'preferences' && <PreferencesSheet visible onClose={close} clientId={client.id} />}
      {sheet === 'tags' && <TagManagementSheet visible onClose={close} clientId={client.id} currentTags={client.tags ?? []} />}
      {sheet === 'contact' && <ContactEditSheet clientId={client.id} client={client} visible onClose={close} />}
      {sheet === 'notes' && (
        <NotesEditSheet clientId={client.id} currentNotes={client.enrichment?.internalNotes ?? null} visible onClose={close} />
      )}
      {sheet === 'fit' && <FitProfileEditSheet clientId={client.id} visible onClose={close} />}
      {sheet === 'clinical-notes' && <ClinicalNotesSheet clientId={client.id} visible onClose={close} />}
      {sheet === 'add-note' && <AddNoteSheet clientId={client.id} visible onClose={close} />}
      {sheet === 'link' && <LinkClientSheet clientId={client.id} visible onClose={close} />}
    </View>
  );
}

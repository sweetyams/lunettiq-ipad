import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { WalkInButton } from '@/src/features/appointments/WalkInButton';
import { useTodayAppointments } from '@/src/api/useAppointments';
import { useVisitActions } from '@/src/features/appointments/useVisitActions';
import { AppointmentRow } from '@/src/features/floor/AppointmentRow';
import { HoldsSection, RecentClientsSection, RxSection } from '@/src/features/floor/FloorRail';
import { Button, PageHeader, Section } from '@/src/ui/kit';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { toast } from '@/src/ui/useToastStore';
import type { Appointment } from '@/src/api/appointments.types';
import { useLayout } from '@/src/ui/layout';

export default function HomeScreen() {
  const layout = useLayout();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useTodayAppointments();

  const { arrive, startVisit } = useVisitActions();
  const queryClient = useQueryClient();

  // Home is the floor's dashboard: refresh it every time staff come back to it,
  // so arrivals, holds and Rx changes made elsewhere show immediately.
  useFocusEffect(
    useCallback(() => {
      for (const queryKey of [['appointments', 'today'], ['inventory-holds'], ['rx-pipeline', 'counts'], ['rx-approvals', 'summary']]) {
        queryClient.invalidateQueries({ queryKey });
      }
    }, [queryClient]),
  );

  // Chronological day list; finished or missed visits sink to the bottom.
  const sortedAppointments = [...(appointments ?? [])].sort((a, b) => {
    const aDone = a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled';
    const bDone = b.status === 'completed' || b.status === 'no_show' || b.status === 'cancelled';
    if (aDone !== bDone) return aDone ? 1 : -1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const list = sortedAppointments;
  const upcoming = list.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const subtitle = list.length
    ? `${dateLabel} · ${list.length} appointment${list.length === 1 ? '' : 's'}${upcoming ? ` · ${upcoming} still to come` : ''}`
    : dateLabel;

  // Network/auth errors fall back to the normal layout (offline-first); real errors show a retry.
  const isRecoverableError = !!error && error instanceof Error && (
    error.message.includes('Network request failed') ||
    error.message.includes('fetch') ||
    error.message.includes('Not authenticated') ||
    error.name === 'TypeError'
  );

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title="Today"
        subtitle={subtitle}
        actions={
          <>
            <Button label="Schedule" icon={Calendar} onPress={() => router.push('/appointments')} />
            <WalkInButton variant="primary" />
          </>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: layout.size === 'compact' ? 24 : 32, paddingBottom: 140, gap: 24, flexDirection: layout.twoPane ? 'row' : 'column', alignItems: layout.twoPane ? 'flex-start' : 'stretch' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Appointments (side by side with the rail; stacked in portrait 11") */}
        <View className={layout.twoPane ? 'flex-[3]' : ''}>
          <Section title="Appointments" count={list.length} padded={false}>
            {isLoading ? (
              <LoadingState />
            ) : error && !isRecoverableError ? (
              <View className="p-[20px]"><ErrorState error="Couldn’t load today’s appointments" onRetry={refetch} /></View>
            ) : list.length === 0 ? (
              <View className="px-[20px] pb-[28px] pt-[8px] items-start gap-[12px]">
                <Text className="text-body-md text-text-secondary">No appointments today. Walk-ins start from Schedule.</Text>
                <Button label="Find a client" size="sm" onPress={() => router.push('/clients')} />
              </View>
            ) : (
              list.map((a, i) => (
                <AppointmentRow
                  key={a.id}
                  first={i === 0}
                  appointment={a}
                  onMarkArrived={() => arrive(a)}
                  onStartVisit={() => startVisit(a)}
                  onOpenVisit={() => startVisit(a)}
                  onPress={() => router.push(`/appointments?selected=${a.id}`)}
                />
              ))
            )}
          </Section>
        </View>

        {/* Rail */}
        <View className={`gap-[24px] ${layout.twoPane ? 'flex-[2]' : ''}`}>
          <RxSection />
          <HoldsSection />
          <RecentClientsSection />
        </View>
      </ScrollView>
    </View>
  );
}

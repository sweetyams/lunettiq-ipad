import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Calendar, UserPlus } from 'lucide-react-native';
import { useTodayAppointments, useMarkArrived, useStartAppointment, useMarkNoShow } from '@/src/api/useAppointments';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { AppointmentRow } from '@/src/features/floor/AppointmentRow';
import { HoldsSection, RecentClientsSection, RxSection } from '@/src/features/floor/FloorRail';
import { Button, PageHeader, Section } from '@/src/ui/kit';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { toast } from '@/src/ui/useToastStore';
import type { Appointment } from '@/src/api/appointments.types';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useTodayAppointments();

  const markArrived = useMarkArrived();
  const startAppointment = useStartAppointment();
  const markNoShow = useMarkNoShow();
  const { startSession, mode: sessionMode, activeClientId } = useSessionStore();
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

  const handleMarkArrived = useCallback((appointmentId: string) => {
    markArrived.mutate(appointmentId);
  }, [markArrived]);

  const handleStartAppointment = useCallback((appointmentId: string) => {
    startAppointment.mutate(appointmentId);
  }, [startAppointment]);

  const handleStartSession = useCallback((appointmentId: string) => {
    const appointment = appointments?.find((a) => a.id === appointmentId);
    if (!appointment?.clientId) {
      toast.warning('No Client', 'This appointment has no linked client.');
      return;
    }
    if (sessionMode !== 'idle' && activeClientId !== appointment.clientId) {
      toast.warning('Visit in progress', 'End the current visit before starting another.');
      return;
    }
    // Starts the visit (local id now; SessionServerBridge creates it on Foundry)
    startSession(appointment.clientId, appointment.clientName || 'Client', {
      appointmentId: appointment.id,
    });
    router.push(`/clients/${appointment.clientId}/session`);
  }, [appointments, sessionMode, activeClientId, startSession, router]);

  const handleAppointmentPress = useCallback((appointmentId: string) => {
    // Could show detail popover in future; for now do nothing
  }, []);

  const handleAppointmentLongPress = useCallback((appointment: Appointment) => {
    const actions: Array<{ text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }> = [];

    if (appointment.status !== 'no_show' && appointment.status !== 'completed') {
      actions.push({
        text: 'Mark No-show',
        style: 'destructive',
        onPress: () => markNoShow.mutate(appointment.id),
      });
    }

    if (appointment.clientId) {
      actions.push({
        text: 'View profile',
        onPress: () => router.push(`/clients/${appointment.clientId}`),
      });
    }

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      appointment.clientName || 'Appointment',
      undefined,
      actions
    );
  }, [markNoShow, router]);

  // Arrived → start the appointment and open the visit in one tap.
  const handleStartVisit = useCallback((appointmentId: string) => {
    startAppointment.mutate(appointmentId);
    handleStartSession(appointmentId);
  }, [startAppointment, handleStartSession]);

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
            <Button label="Week schedule" icon={Calendar} onPress={() => router.push('/appointments')} />
            <Button label="New client" icon={UserPlus} variant="primary" onPress={() => router.push('/clients/new')} />
          </>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 32, paddingBottom: 140, gap: 24, flexDirection: 'row', alignItems: 'flex-start' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Appointments */}
        <View className="flex-[3]">
          <Section title="Appointments" count={list.length} padded={false}>
            {isLoading ? (
              <LoadingState />
            ) : error && !isRecoverableError ? (
              <View className="p-[20px]"><ErrorState error="Couldn’t load today’s appointments" onRetry={refetch} /></View>
            ) : list.length === 0 ? (
              <View className="px-[20px] pb-[28px] pt-[8px] items-start gap-[12px]">
                <Text className="text-body-md text-text-secondary">No appointments today. Walk-ins start from Clients.</Text>
                <Button label="Find a client" size="sm" onPress={() => router.push('/clients')} />
              </View>
            ) : (
              list.map((a, i) => (
                <AppointmentRow
                  key={a.id}
                  first={i === 0}
                  appointment={a}
                  onMarkArrived={handleMarkArrived}
                  onStartVisit={handleStartVisit}
                  onOpenVisit={handleStartSession}
                  onPress={a.clientId ? () => router.push(`/clients/${a.clientId}`) : undefined}
                  onLongPress={() => handleAppointmentLongPress(a)}
                />
              ))
            )}
          </Section>
        </View>

        {/* Rail */}
        <View className="flex-[2] gap-[24px]">
          <RxSection />
          <HoldsSection />
          <RecentClientsSection />
        </View>
      </ScrollView>
    </View>
  );
}

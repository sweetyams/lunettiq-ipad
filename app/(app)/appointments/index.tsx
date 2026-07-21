import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTodayAppointments, useCheckIn, useMarkNoShow } from '@/src/api/useAppointments';
import { useStaffSchedules } from '@/src/api/useAppointments';
import { Appointment } from '@/src/api/appointments.types';
import { AppointmentCard, LoadingState, ErrorState, EmptyState } from '@/src/ui';
import { AppointmentDetailPanel } from '@/src/features/appointments/AppointmentDetailPanel';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');

  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const { data: appointments, isLoading, error, refetch, isRefetching } = useTodayAppointments();
  const { data: staffSchedules } = useStaffSchedules(today);
  const checkIn = useCheckIn();
  const markNoShow = useMarkNoShow();

  // Sort appointments: in_progress first, then by time, completed/no-show at bottom
  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        in_progress: 0,
        confirmed: 1,
        scheduled: 2,
        completed: 3,
        no_show: 4,
        cancelled: 5,
      };
      const aOrder = statusOrder[a.status] ?? 3;
      const bOrder = statusOrder[b.status] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [appointments]);

  const selectedAppointment = useMemo(
    () => sortedAppointments.find((a) => a.id === selectedAppointmentId) ?? null,
    [sortedAppointments, selectedAppointmentId]
  );

  const handleCheckIn = useCallback(
    (id: string) => {
      checkIn.mutate(id);
    },
    [checkIn]
  );

  const handleStartSession = useCallback(
    (id: string) => {
      const appointment = sortedAppointments.find((a) => a.id === id);
      if (appointment?.clientId) {
        router.push(`/clients/${appointment.clientId}`);
      }
    },
    [sortedAppointments, router]
  );

  const handleMarkNoShow = useCallback(
    (id: string) => {
      markNoShow.mutate(id);
    },
    [markNoShow]
  );

  const handleSelectAppointment = useCallback((id: string) => {
    setSelectedAppointmentId(id);
  }, []);

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeCount = sortedAppointments.filter(
    (a) => a.status === 'in_progress'
  ).length;

  const upcomingCount = sortedAppointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'confirmed'
  ).length;

  const renderAppointmentItem = useCallback(
    ({ item }: { item: Appointment }) => (
      <AppointmentCard
        appointment={item}
        onCheckIn={handleCheckIn}
        onStartSession={handleStartSession}
        onPress={handleSelectAppointment}
      />
    ),
    [handleCheckIn, handleStartSession, handleSelectAppointment]
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-displayLg text-text-primary">Appointments</Text>
            <Text className="text-body text-text-muted mt-xs">{formatDate()}</Text>
          </View>

          {/* View toggle */}
          <View className="flex-row bg-bg-surface border border-border rounded-md">
            <Pressable
              onPress={() => setViewMode('today')}
              className={`px-lg py-sm rounded-md min-h-[44px] items-center justify-center ${
                viewMode === 'today' ? 'bg-brand' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Today view"
            >
              <Text
                className={`text-bodyStrong ${
                  viewMode === 'today' ? 'text-brand-text' : 'text-text-primary'
                }`}
              >
                Today
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setViewMode('week');
                router.push('/appointments/week');
              }}
              className={`px-lg py-sm rounded-md min-h-[44px] items-center justify-center ${
                viewMode === 'week' ? 'bg-brand' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Week view"
            >
              <Text
                className={`text-bodyStrong ${
                  viewMode === 'week' ? 'text-brand-text' : 'text-text-primary'
                }`}
              >
                Week
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-lg mt-md">
          {activeCount > 0 && (
            <View className="flex-row items-center gap-xs">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-caption text-text-muted">
                {activeCount} in progress
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-xs">
            <Clock color="#737373" size={14} />
            <Text className="text-caption text-text-muted">
              {upcomingCount} upcoming
            </Text>
          </View>
          {staffSchedules && staffSchedules.length > 0 && (
            <View className="flex-row items-center gap-xs">
              <Text className="text-caption text-text-muted">
                {staffSchedules.length} staff on duty
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Main content — split layout */}
      <View className="flex-1 flex-row">
        {/* Left panel — Appointment list */}
        <View className="w-[420px] border-r border-border">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => refetch()}
            />
          ) : sortedAppointments.length === 0 ? (
            <EmptyState
              message="No appointments today. Walk-in clients can be started from the Clients tab."
            />
          ) : (
            <FlatList
              data={sortedAppointments}
              keyExtractor={(item) => item.id}
              renderItem={renderAppointmentItem}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
              }
            />
          )}
        </View>

        {/* Right panel — Detail */}
        <View className="flex-1">
          {selectedAppointment ? (
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              onCheckIn={handleCheckIn}
              onStartSession={handleStartSession}
              onMarkNoShow={handleMarkNoShow}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Calendar color="#D4D4D4" size={48} />
              <Text className="text-body text-text-muted mt-md">
                Select an appointment to view details
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

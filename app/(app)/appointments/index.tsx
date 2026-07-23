import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTodayAppointments, useMarkArrived, useStartAppointment, useMarkNoShow, useSchedulingStaff, useAppointmentServices } from '@/src/api/useAppointments';
import { useStaffSchedules } from '@/src/api/useAppointments';
import { useOfflineAppointments } from '@/src/sync/useOfflineFallback';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { Appointment } from '@/src/api/appointments.types';
import { AppointmentCard, LoadingState, ErrorState, EmptyState } from '@/src/ui';
import { AppointmentDetailPanel, CreateAppointmentSheet, EditAppointmentSheet, WalkInButton, FollowUpBookingButton } from '@/src/features/appointments';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { selected } = useLocalSearchParams<{ selected?: string }>();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const { data: appointments, isLoading, error, refetch, isRefetching } = useTodayAppointments();
  const { data: offlineAppointments } = useOfflineAppointments(today);
  const { data: staffSchedules } = useStaffSchedules(today);
  const { data: staff } = useSchedulingStaff();
  const { data: services } = useAppointmentServices();
  const markArrived = useMarkArrived();
  const startAppointment = useStartAppointment();
  const markNoShow = useMarkNoShow();
  const isOnline = useSyncStore((s) => s.isOnline);

  // Use offline data when online fetch fails
  const resolvedAppointments: Appointment[] = appointments ?? (offlineAppointments as unknown as Appointment[]) ?? [];
  const isOfflineData = !appointments && !!offlineAppointments;

  // Set the selected appointment from deep link
  useEffect(() => {
    if (selected && !selectedAppointmentId) {
      setSelectedAppointmentId(selected);
    }
  }, [selected, selectedAppointmentId]);

  // Filter appointments by staff if selected
  const filteredAppointments = useMemo(() => {
    if (!resolvedAppointments) return [];
    if (!selectedStaffId) return resolvedAppointments;
    return resolvedAppointments.filter(appt => appt.staffId === selectedStaffId);
  }, [resolvedAppointments, selectedStaffId]);

  // Sort appointments: in_progress first, arrived next, then by time, completed/no-show at bottom
  const sortedAppointments = useMemo(() => {
    if (!filteredAppointments) return [];
    return [...filteredAppointments].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        in_progress: 0,
        arrived: 1,
        confirmed: 2,
        scheduled: 3,
        completed: 4,
        no_show: 5,
        cancelled: 6,
      };
      const aOrder = statusOrder[a.status] ?? 4;
      const bOrder = statusOrder[b.status] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    });
  }, [filteredAppointments]);

  const selectedAppointment = useMemo(
    () => sortedAppointments.find((a) => a.id === selectedAppointmentId) ?? null,
    [sortedAppointments, selectedAppointmentId]
  );

  const handleMarkArrived = useCallback(
    (id: string) => {
      markArrived.mutate(id);
    },
    [markArrived]
  );

  const handleStartAppointment = useCallback(
    (id: string) => {
      startAppointment.mutate(id);
    },
    [startAppointment]
  );

  const handleStartSession = useCallback(
    (id: string) => {
      const appointment = sortedAppointments.find((a) => a.id === id);
      if (appointment?.clientId) {
        router.push(`/clients/${appointment.clientId}/session`);
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

  const handleEdit = useCallback(() => {
    setShowEditSheet(true);
  }, []);

  const handleCancelled = useCallback(() => {
    setSelectedAppointmentId(null);
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
        onMarkArrived={handleMarkArrived}
        onStartAppointment={handleStartAppointment}
        onStartSession={handleStartSession}
        onPress={handleSelectAppointment}
      />
    ),
    [handleMarkArrived, handleStartAppointment, handleStartSession, handleSelectAppointment]
  );

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-display-lg text-text-primary">Appointments</Text>
            <Text className="text-body-md text-text-muted mt-xs">{formatDate()}</Text>
          </View>

          <View className="flex-row items-center gap-md">
            {/* Walk-in button */}
            <WalkInButton />
            
            {/* New appointment button */}
            <Pressable 
              onPress={() => setShowCreateSheet(true)}
              className="bg-brand rounded-md px-lg py-sm min-h-[44px] flex-row items-center gap-sm"
              accessibilityRole="button"
              accessibilityLabel="New appointment"
            >
              <Plus color="#FFFFFF" size={20} />
              <Text className="text-brand-text text-body-md font-medium">New</Text>
            </Pressable>

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
                  className={`text-body-md font-medium ${
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
                  className={`text-body-md font-medium ${
                    viewMode === 'week' ? 'text-brand-text' : 'text-text-primary'
                  }`}
                >
                  Week
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/appointments/staff-schedule')}
                className="px-lg py-sm rounded-md min-h-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Staff schedule"
              >
                <Text className="text-body-md font-medium text-text-primary">
                  Staff
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-lg mt-md">
          {activeCount > 0 && (
            <View className="flex-row items-center gap-xs">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-caption-md text-text-muted">
                {activeCount} in progress
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-xs">
            <Clock color="#737373" size={14} />
            <Text className="text-caption-md text-text-muted">
              {upcomingCount} upcoming
            </Text>
          </View>
          {staffSchedules && staffSchedules.length > 0 && (
            <View className="flex-row items-center gap-xs">
              <Text className="text-caption-md text-text-muted">
                {staffSchedules.length} staff on duty
              </Text>
            </View>
          )}
        </View>

        {/* Staff filter pills */}
        {staff && staff.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-md"
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            <View className="flex-row gap-sm">
              <Pressable
                onPress={() => setSelectedStaffId(null)}
                className={`px-md py-sm rounded-md min-h-[36px] items-center justify-center border ${
                  selectedStaffId === null 
                    ? 'bg-brand border-brand' 
                    : 'bg-bg-surface border-border'
                }`}
                accessibilityRole="button"
                accessibilityLabel="All staff"
              >
                <Text
                  className={`text-body-sm ${
                    selectedStaffId === null ? 'text-brand-text' : 'text-text-primary'
                  }`}
                >
                  All Staff
                </Text>
              </Pressable>
              {staff.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => setSelectedStaffId(member.id)}
                  className={`px-md py-sm rounded-md min-h-[36px] items-center justify-center border ${
                    selectedStaffId === member.id 
                      ? 'bg-brand border-brand' 
                      : 'bg-bg-surface border-border'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${member.name}`}
                >
                  <Text
                    className={`text-body-sm ${
                      selectedStaffId === member.id ? 'text-brand-text' : 'text-text-primary'
                    }`}
                  >
                    {member.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Main content — split layout */}
      <View className="flex-1 flex-row">
        {/* Left panel — Appointment list */}
        <View className="w-[420px] border-r border-border">
          {isOfflineData && (
            <View className="bg-color-bg-muted px-md py-sm flex-row items-center gap-sm">
              <Text className="text-body-sm text-color-text-muted">Showing cached data</Text>
            </View>
          )}
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
              onMarkArrived={handleMarkArrived}
              onStartAppointment={handleStartAppointment}
              onStartSession={handleStartSession}
              onMarkNoShow={handleMarkNoShow}
              onEdit={handleEdit}
              onCancelled={handleCancelled}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Calendar color="#D4D4D4" size={48} />
              <Text className="text-body-md text-text-muted mt-md">
                Select an appointment to view details
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sheets */}
      {/* Create appointment sheet */}
      <CreateAppointmentSheet 
        visible={showCreateSheet} 
        onClose={() => setShowCreateSheet(false)} 
        preselectedDate={today} 
      />

      {selectedAppointment && (
        <EditAppointmentSheet
          visible={showEditSheet}
          onClose={() => setShowEditSheet(false)}
          onSaved={() => {
            setShowEditSheet(false);
            // Appointment list will auto-refresh via TanStack Query invalidation
          }}
          appointment={selectedAppointment}
        />
      )}

      {/* Follow-up booking for completed appointments */}
      {selectedAppointment?.status === 'completed' && selectedAppointment?.clientId && (
        <FollowUpBookingButton
          clientId={selectedAppointment.clientId}
          clientName={selectedAppointment.clientName ?? undefined}
          variant="ghost"
          serviceType="follow-up"
        />
      )}
    </View>
  );
}

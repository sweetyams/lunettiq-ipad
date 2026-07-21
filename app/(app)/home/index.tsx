import { View, Text, FlatList, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { useTodayAppointments, useCheckIn, useMarkNoShow } from '@/src/api/useAppointments';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { AppointmentCard } from '@/src/ui/AppointmentCard';
import { ActiveHoldsCard } from '@/src/ui/ActiveHoldsCard';
import { RecentClientsCard } from '@/src/ui/RecentClientsCard';
import { QuickActionsGrid } from '@/src/ui/QuickActionsGrid';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { toast } from '@/src/ui/useToastStore';
import type { Appointment, InventoryHold } from '@/src/api/appointments.types';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: appointments,
    isLoading,
    error,
    refetch,
  } = useTodayAppointments();

  const checkIn = useCheckIn();
  const markNoShow = useMarkNoShow();
  const { setClient } = useSessionStore();

  // Sort appointments: in_progress first, then by startsAt, past at bottom
  const sortedAppointments = [...(appointments ?? [])].sort((a, b) => {
    // in_progress always at top
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    // completed/no_show at bottom
    const aDone = a.status === 'completed' || a.status === 'no_show';
    const bDone = b.status === 'completed' || b.status === 'no_show';
    if (aDone && !bDone) return 1;
    if (bDone && !aDone) return -1;
    // Sort by start time
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  const handleCheckIn = useCallback((appointmentId: string) => {
    checkIn.mutate(appointmentId);
  }, [checkIn]);

  const handleStartSession = useCallback((appointmentId: string) => {
    const appointment = appointments?.find((a) => a.id === appointmentId);
    if (!appointment?.clientId) {
      toast.warning('No Client', 'This appointment has no linked client.');
      return;
    }
    // Set client in session store (starts session mode + timer)
    setClient(appointment.clientId);
    // Navigate to session workspace
    router.push(`/clients/${appointment.clientId}/session`);
  }, [appointments, setClient, router]);

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

  const handleHoldPress = useCallback((hold: InventoryHold) => {
    router.push(`/products/${hold.productId}`);
  }, [router]);

  const handleClientPress = useCallback((clientId: string) => {
    router.push(`/clients/${clientId}`);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderAppointmentCard = useCallback(({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      onCheckIn={handleCheckIn}
      onStartSession={handleStartSession}
      onPress={handleAppointmentPress}
      onLongPress={() => handleAppointmentLongPress(item)}
    />
  ), [handleCheckIn, handleStartSession, handleAppointmentPress, handleAppointmentLongPress]);

  // Full loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-bg-page">
        <View className="px-xl pt-2xl pb-lg border-b border-border">
          <Text className="text-displayLg text-text-primary">Today</Text>
          <Text className="text-body text-text-muted mt-xs">{formatDate()}</Text>
        </View>
        <View className="flex-1 flex-row">
          <View className="flex-[3] p-xl">
            <LoadingState />
          </View>
          <View className="flex-[2] border-l border-border p-lg">
            <LoadingState />
          </View>
        </View>
      </View>
    );
  }

  // Error state — show as empty if network/auth error (offline-first), real error otherwise
  if (error) {
    const isRecoverableError = error instanceof Error && (
      error.message.includes('Network request failed') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('Not authenticated') ||
      error.message.includes('UNAUTHORIZED') ||
      error.name === 'TypeError' ||
      (error as any).code === 'UNAUTHORIZED'
    );

    if (!isRecoverableError) {
      return (
        <View className="flex-1 bg-bg-page">
          <View className="px-xl pt-2xl pb-lg border-b border-border">
            <Text className="text-displayLg text-text-primary">Today</Text>
            <Text className="text-body text-text-muted mt-xs">{formatDate()}</Text>
          </View>
          <View className="flex-1 items-center justify-center p-xl">
            <ErrorState error="Failed to load appointments" onRetry={refetch} />
          </View>
        </View>
      );
    }
    // Network errors fall through to render the main view with empty data
  }

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <Text className="text-displayLg text-text-primary">Today</Text>
        <Text className="text-body text-text-muted mt-xs">{formatDate()}</Text>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Panel — Appointments */}
        <View className="flex-[3]">
          {sortedAppointments.length === 0 ? (
            <View className="flex-1 items-center justify-center p-xl">
              <Calendar color="#A3A3A3" size={40} />
              <Text className="text-headline text-text-primary mt-lg">
                No appointments today
              </Text>
              <Text className="text-body text-text-muted mt-sm text-center">
                Walk-in clients can be started from the Clients tab
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 24 }}
              ItemSeparatorComponent={() => <View className="h-sm" />}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          )}
        </View>

        {/* Right Panel — Sidebar */}
        <View className="flex-[2] border-l border-border">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <ActiveHoldsCard onHoldPress={handleHoldPress} />
            <RecentClientsCard onClientPress={handleClientPress} />
            <QuickActionsGrid />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

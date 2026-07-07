import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppointments, useUpdateAppointment } from '@/src/api/useAppointments';
import { AppointmentCard } from '@/src/ui/AppointmentCard';
import { Appointment } from '@/src/api/appointments.types';

export default function HomeScreen() {
  const router = useRouter();
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const { 
    data: appointments = [], 
    isLoading, 
    error, 
    refetch 
  } = useAppointments({ date: today });
  
  const updateAppointment = useUpdateAppointment();

  const handleCheckIn = (appointmentId: string) => {
    updateAppointment.mutate({
      id: appointmentId,
      data: { status: 'in_progress' }
    });
  };

  const handleStartSession = (appointmentId: string) => {
    // Find the appointment to get client info
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment?.clientId) {
      router.push(`/clients/${appointment.clientId}/session`);
    }
  };

  const handleAppointmentPress = (appointmentId: string) => {
    // Navigate to appointments tab - dynamic route will be added later
    router.push('/appointments');
  };

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <AppointmentCard
      appointment={item}
      onCheckIn={handleCheckIn}
      onStartSession={handleStartSession}
      onPress={handleAppointmentPress}
    />
  );

  const renderQuickActions = () => (
    <View className="bg-white rounded-lg border border-warmGrey p-lg">
      <Text className="text-headline text-charcoal mb-lg">Quick Actions</Text>
      
      <View className="gap-sm">
        <Pressable 
          onPress={() => router.push('/clients')}
          className="bg-navy px-lg py-md rounded-md min-h-[44px] items-center justify-center"
        >
          <Text className="text-bodyStrong text-white">Search Client</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => router.push('/clients/new')}
          className="bg-navy px-lg py-md rounded-md min-h-[44px] items-center justify-center"
        >
          <Text className="text-bodyStrong text-white">New Client</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => router.push('/products')}
          className="bg-navy px-lg py-md rounded-md min-h-[44px] items-center justify-center"
        >
          <Text className="text-bodyStrong text-white">Browse Products</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-xl">
      <Text className="text-displayMd text-charcoal mb-sm text-center">
        No appointments today
      </Text>
      <Text className="text-body text-midGrey mb-lg text-center">
        Ready to help walk-in clients
      </Text>
      <Pressable 
        onPress={() => router.push('/products')}
        className="bg-green px-xl py-md rounded-md"
      >
        <Text className="text-bodyStrong text-white">Browse Products</Text>
      </Pressable>
    </View>
  );

  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center p-xl">
      <Text className="text-headline text-error mb-sm text-center">
        Unable to load appointments
      </Text>
      <Text className="text-body text-midGrey mb-lg text-center">
        {error instanceof Error ? error.message : 'Something went wrong'}
      </Text>
      <Pressable 
        onPress={() => refetch()}
        className="bg-navy px-xl py-md rounded-md"
      >
        <Text className="text-bodyStrong text-white">Try Again</Text>
      </Pressable>
    </View>
  );

  const renderLoadingState = () => (
    <View className="flex-1 p-lg">
      <View className="bg-white rounded-lg border border-warmGrey p-md mb-sm opacity-60">
        <View className="h-5 bg-warmGrey rounded mb-sm" />
        <View className="h-4 bg-warmGrey rounded w-3/4 mb-xs" />
        <View className="h-3 bg-warmGrey rounded w-1/2" />
      </View>
      <View className="bg-white rounded-lg border border-warmGrey p-md mb-sm opacity-40">
        <View className="h-5 bg-warmGrey rounded mb-sm" />
        <View className="h-4 bg-warmGrey rounded w-3/4 mb-xs" />
        <View className="h-3 bg-warmGrey rounded w-1/2" />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-offWhite">
      <View className="flex-row flex-1">
        {/* Left panel - Appointments */}
        <View className="flex-[3] p-2xl">
          <View className="mb-lg">
            <Text className="text-displayLg text-charcoal font-bold mb-xs">Today</Text>
            <Text className="text-body text-midGrey">{formatDate()}</Text>
          </View>
          
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : sortedAppointments.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={sortedAppointments}
              renderItem={renderAppointment}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refetch}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        
        {/* Right panel - Quick Actions */}
        <View className="flex-[2] p-2xl border-l border-warmGrey">
          {renderQuickActions()}
        </View>
      </View>
    </View>
  );
}
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppointments, useStaffSchedules, useSchedulingStaff, useAppointmentServices } from '@/src/api/useAppointments';
import { Appointment } from '@/src/api/appointments.types';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Generate time slots from 9 AM to 6 PM
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    slots.push(`${hour}:00`);
    if (hour < 18) slots.push(`${hour}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function StaffScheduleScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateStr = formatDate(selectedDate);

  const { data: staff } = useSchedulingStaff();
  const { data: staffSchedules } = useStaffSchedules(selectedDateStr);
  const { data: appointments, isLoading, error } = useAppointments({ date: selectedDateStr });
  const { data: services } = useAppointmentServices();

  // Group appointments by staff ID
  const appointmentsByStaff = useMemo(() => {
    if (!appointments) return {};
    const grouped: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      if (appt.staffId) {
        if (!grouped[appt.staffId]) grouped[appt.staffId] = [];
        grouped[appt.staffId]!.push(appt);
      }
    }
    return grouped;
  }, [appointments]);

  // Get working staff for the selected date
  const workingStaff = useMemo(() => {
    if (!staff || !staffSchedules) return [];
    return staff.filter(member => 
      staffSchedules.some(schedule => schedule.id === member.id)
    );
  }, [staff, staffSchedules]);

  const handlePreviousDay = useCallback(() => {
    setSelectedDate(prev => addDays(prev, -1));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(prev => addDays(prev, 1));
  }, []);

  const handleBackToAppointments = useCallback(() => {
    router.back();
  }, [router]);

  const handleAppointmentTap = useCallback((appointment: Appointment) => {
    // Navigate to day view with this appointment selected
    router.push({
      pathname: '/appointments',
      params: { selectedAppointmentId: appointment.id }
    });
  }, [router]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  const getServiceColor = (serviceType: string) => {
    // Simple color mapping - could be enhanced with service data
    switch (serviceType?.toLowerCase()) {
      case 'fitting':
        return 'border-brand';
      case 'consultation':
        return 'border-success';
      case 'pickup':
        return 'border-info';
      case 'adjustment':
        return 'border-warning';
      default:
        return 'border-border';
    }
  };

  const getAppointmentForTimeSlot = (staffId: string, timeSlot: string) => {
    const staffAppointments = appointmentsByStaff[staffId] || [];
    return staffAppointments.find(appt => {
      const apptTime = formatTime(appt.startsAt);
      return apptTime === timeSlot;
    });
  };

  const isCurrentTime = (timeSlot: string) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    const isToday = formatDate(now) === selectedDateStr;
    return isToday && currentTime === timeSlot;
  };

  const dateLabel = useMemo(() => {
    const today = new Date();
    const isToday = formatDate(selectedDate) === formatDate(today);
    const isTomorrow = formatDate(selectedDate) === formatDate(addDays(today, 1));
    const isYesterday = formatDate(selectedDate) === formatDate(addDays(today, -1));

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    if (isYesterday) return 'Yesterday';
    
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate, selectedDateStr]);

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={handleBackToAppointments}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Back to appointments"
            >
              <ChevronLeft color="#171717" size={24} />
            </Pressable>
            <Text className="text-display-lg text-text-primary">Staff Schedule</Text>
          </View>

          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={handlePreviousDay}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border"
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <ChevronLeft color="#171717" size={20} />
            </Pressable>
            <Text className="text-body-lg font-medium text-text-primary min-w-[120px] text-center">
              {dateLabel}
            </Text>
            <Pressable
              onPress={handleNextDay}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border"
              accessibilityRole="button"
              accessibilityLabel="Next day"
            >
              <ChevronRight color="#171717" size={20} />
            </Pressable>
          </View>
        </View>
        
        {/* Stats */}
        <View className="flex-row items-center gap-lg mt-md">
          <View className="flex-row items-center gap-xs">
            <Clock color="#737373" size={14} />
            <Text className="text-caption-md text-text-muted">
              {workingStaff.length} staff on duty
            </Text>
          </View>
          {appointments && (
            <Text className="text-caption-md text-text-muted">
              {appointments.length} appointments
            </Text>
          )}
        </View>
      </View>

      {/* Schedule grid */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => {}} />
      ) : workingStaff.length === 0 ? (
        <EmptyState message="No staff scheduled for this day" />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header row with staff names */}
          <View className="flex-row border-b border-border">
            {/* Time column header */}
            <View className="w-20 p-md border-r border-border bg-bg-muted">
              <Text className="text-caption-md text-text-muted font-mono">Time</Text>
            </View>
            
            {/* Staff column headers */}
            {workingStaff.map((member) => (
              <View key={member.id} className="flex-1 p-md border-r border-border bg-bg-surface">
                <Text className="text-body-sm font-medium text-text-primary text-center">
                  {member.name}
                </Text>
                <Text className="text-caption-xs text-text-muted text-center mt-xs">
                  {appointmentsByStaff[member.id]?.length || 0} appointments
                </Text>
              </View>
            ))}
          </View>

          {/* Time slot rows */}
          {TIME_SLOTS.map((timeSlot) => {
            const isCurrent = isCurrentTime(timeSlot);
            
            return (
              <View
                key={timeSlot}
                className={`flex-row border-b border-border min-h-[60px] ${
                  isCurrent ? 'bg-bg-surface-hover' : ''
                }`}
              >
                {/* Time label */}
                <View className="w-20 p-sm border-r border-border items-center justify-center">
                  <Text className={`text-caption-md font-mono ${
                    isCurrent ? 'text-text-primary font-medium' : 'text-text-muted'
                  }`}>
                    {timeSlot}
                  </Text>
                  {isCurrent && <View className="w-2 h-2 rounded-full bg-brand mt-xs" />}
                </View>

                {/* Staff columns */}
                {workingStaff.map((member) => {
                  const appointment = getAppointmentForTimeSlot(member.id, timeSlot);
                  
                  return (
                    <View key={member.id} className="flex-1 p-sm border-r border-border">
                      {appointment ? (
                        <Pressable
                          onPress={() => handleAppointmentTap(appointment)}
                          className={`bg-bg-surface-hover rounded-sm p-xs border-l-2 ${getServiceColor(appointment.type)} min-h-[44px] justify-center`}
                          accessibilityRole="button"
                          accessibilityLabel={`View ${appointment.clientName} appointment`}
                        >
                          <Text className="text-body-xs font-medium text-text-primary">
                            {appointment.clientName || 'Walk-in'}
                          </Text>
                          <Text className="text-caption-xs text-text-muted">
                            {appointment.type} • {appointment.duration}min
                          </Text>
                          {appointment.status === 'in_progress' && (
                            <View className="flex-row items-center gap-xs mt-xs">
                              <View className="w-2 h-2 rounded-full bg-success" />
                              <Text className="text-caption-xs text-success font-medium">
                                In Progress
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      ) : (
                        <View className="min-h-[44px]" />
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Current time indicator line */}
          {isCurrentTime && (
            <View className="absolute left-20 right-0 h-0.5 bg-brand z-10" style={{ 
              top: TIME_SLOTS.findIndex(slot => isCurrentTime(slot)) * 60 + 60 // Header height + row height
            }} />
          )}
        </ScrollView>
      )}
    </View>
  );
}
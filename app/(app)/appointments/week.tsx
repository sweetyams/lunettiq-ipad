import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWeekAppointments, useStaffSchedules } from '@/src/api/useAppointments';
import { Appointment } from '@/src/api/appointments.types';
import { LoadingState, ErrorState, EmptyState } from '@/src/ui';
import { CreateAppointmentSheet } from '@/src/features/appointments';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = start of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function WeekViewScreen() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  });
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const selectedDate = useMemo(() => addDays(weekStart, selectedDayIndex), [weekStart, selectedDayIndex]);
  const selectedDateStr = formatDate(selectedDate);

  const { data: weekAppointments, isLoading, error, refetch } = useWeekAppointments(weekStart);
  const { data: staffSchedules } = useStaffSchedules(selectedDateStr);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    if (!weekAppointments) return {};
    const grouped: Record<string, Appointment[]> = {};
    for (const appt of weekAppointments) {
      const dateKey = appt.startsAt.substring(0, 10); // YYYY-MM-DD
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey]!.push(appt);
    }
    // Sort each day by time
    for (const key of Object.keys(grouped)) {
      grouped[key]!.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
    }
    return grouped;
  }, [weekAppointments]);

  const selectedDayAppointments = appointmentsByDate[selectedDateStr] ?? [];

  const handlePreviousWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
  }, []);

  const handleBackToToday = useCallback(() => {
    router.back();
  }, [router]);

  const handleAppointmentTap = useCallback((appointment: Appointment) => {
    // Navigate back to day view with this appointment's date and select it
    const appointmentDate = appointment.startsAt.substring(0, 10); // YYYY-MM-DD
    router.push({
      pathname: '/appointments',
      params: { selectedDate: appointmentDate, selectedAppointmentId: appointment.id }
    });
  }, [router]);

  const isToday = (dayIndex: number) => {
    const date = addDays(weekStart, dayIndex);
    return formatDate(date) === formatDate(new Date());
  };

  const getDayCount = (dayIndex: number) => {
    const dateStr = formatDate(addDays(weekStart, dayIndex));
    return appointmentsByDate[dateStr]?.length ?? 0;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-success';
      case 'confirmed':
        return 'bg-info';
      case 'completed':
        return 'bg-bg-muted';
      case 'no_show':
        return 'bg-error';
      case 'cancelled':
        return 'bg-bg-muted';
      default:
        return 'bg-border';
    }
  };

  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6);
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  }, [weekStart]);

  return (
    <View className="flex-1 bg-bg-page">
      {/* Header */}
      <View className="px-xl pt-2xl pb-lg border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-md">
            <Pressable
              onPress={handleBackToToday}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Back to today"
            >
              <ChevronLeft color="#1A1A1A" size={24} />
            </Pressable>
            <Text className="text-display-lg text-text-primary">Week View</Text>
          </View>

          <View className="flex-row items-center gap-md">
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

            <Pressable
              onPress={handlePreviousWeek}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border"
              accessibilityRole="button"
              accessibilityLabel="Previous week"
            >
              <ChevronLeft color="#1A1A1A" size={20} />
            </Pressable>
            <Text className="text-body-lg font-medium text-text-primary min-w-[120px] text-center">
              {weekLabel}
            </Text>
            <Pressable
              onPress={handleNextWeek}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-border"
              accessibilityRole="button"
              accessibilityLabel="Next week"
            >
              <ChevronRight color="#1A1A1A" size={20} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Calendar strip — 7 days */}
      <View className="px-xl py-md border-b border-border">
        <View className="flex-row justify-between">
          {DAY_NAMES.map((dayName, index) => {
            const date = addDays(weekStart, index);
            const dayNum = date.getDate();
            const isSelected = index === selectedDayIndex;
            const isTodayDay = isToday(index);
            const count = getDayCount(index);

            return (
              <Pressable
                key={dayName}
                onPress={() => setSelectedDayIndex(index)}
                className={`items-center px-md py-sm rounded-lg min-w-[72px] min-h-[44px] ${
                  isSelected ? 'bg-brand' : isTodayDay ? 'bg-bg-surface border border-border' : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel={`${dayName} ${dayNum}, ${count} appointments`}
              >
                <Text
                  className={`text-caption ${
                    isSelected ? 'text-brand-text' : 'text-text-muted'
                  }`}
                >
                  {dayName}
                </Text>
                <Text
                  className={`text-headline mt-xs ${
                    isSelected ? 'text-brand-text' : 'text-text-primary'
                  }`}
                >
                  {dayNum}
                </Text>
                {count > 0 && (
                  <View
                    className={`mt-xs w-5 h-5 rounded-full items-center justify-center ${
                      isSelected ? 'bg-brand-foreground' : 'bg-bg-surface border border-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Day detail */}
      <View className="flex-1 flex-row">
        {/* Main appointment list */}
        <View className="flex-1">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : selectedDayAppointments.length === 0 ? (
            <EmptyState
              message={`No appointments scheduled for ${selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
            />
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Time slots */}
              {selectedDayAppointments.map((appointment) => (
                <View
                  key={appointment.id}
                  className="flex-row mb-md"
                >
                  {/* Time column */}
                  <View className="w-[80px] pt-md">
                    <Text className="text-caption-md text-text-muted font-mono">
                      {formatTime(appointment.startsAt)}
                    </Text>
                  </View>

                  {/* Appointment card */}
                  <Pressable 
                    onPress={() => handleAppointmentTap(appointment)}
                    className="flex-1 bg-bg-surface border border-border rounded-lg p-md min-h-[44px] justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={`View ${appointment.clientName ?? 'Walk-in'} appointment`}
                  >
                    <View className="flex-row items-center gap-sm mb-xs">
                      <View className={`w-2 h-2 rounded-full ${getStatusColor(appointment.status)}`} />
                      <Text className="text-body-md font-medium text-text-primary">
                        {appointment.clientName ?? 'Walk-in'}
                      </Text>
                    </View>
                    <Text className="text-caption-md text-text-muted">
                      {appointment.type} • {appointment.duration} min
                      {appointment.staffName ? ` • ${appointment.staffName}` : ''}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Staff sidebar */}
        {staffSchedules && staffSchedules.length > 0 && (
          <View className="w-[240px] border-l border-border p-md">
            <Text className="text-caption-lg font-medium text-text-muted uppercase tracking-wide mb-md">
              Staff on Duty
            </Text>
            {staffSchedules.map((schedule) => {
              const staffAppointments = selectedDayAppointments.filter(
                appt => appt.staffId === schedule.id
              );
              
              return (
                <View key={schedule.id} className="mb-lg">
                  <View className="flex-row items-center justify-between mb-xs">
                    <Text className="text-body-md font-medium text-text-primary">
                      {schedule.staffName}
                    </Text>
                    <View className="w-5 h-5 rounded-full bg-bg-muted items-center justify-center">
                      <Text className="text-caption-xs text-text-muted font-mono">
                        {staffAppointments.length}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-caption-md text-text-muted mb-sm">
                    {schedule.startTime} – {schedule.endTime}
                  </Text>
                  
                  {/* Staff's appointments for selected day */}
                  {staffAppointments.length > 0 && (
                    <View className="gap-xs">
                      {staffAppointments.slice(0, 3).map((appt) => (
                        <Pressable
                          key={appt.id}
                          onPress={() => handleAppointmentTap(appt)}
                          className="bg-bg-surface-hover rounded-sm px-xs py-xs border-l-2 border-brand"
                          accessibilityRole="button"
                          accessibilityLabel={`View ${appt.clientName} appointment`}
                        >
                          <Text className="text-caption-md text-text-primary font-medium">
                            {formatTime(appt.startsAt)}
                          </Text>
                          <Text className="text-caption-xs text-text-muted">
                            {appt.clientName ?? 'Walk-in'}
                          </Text>
                        </Pressable>
                      ))}
                      {staffAppointments.length > 3 && (
                        <Text className="text-caption-xs text-text-muted">
                          +{staffAppointments.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Create appointment sheet */}
      <CreateAppointmentSheet 
        visible={showCreateSheet} 
        onClose={() => setShowCreateSheet(false)} 
        preselectedDate={selectedDateStr}
      />
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Appointment } from '@/src/api/appointments.types';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface AppointmentCardProps {
  appointment: Appointment;
  onCheckIn?: (id: string) => void;
  onStartSession?: (id: string) => void;
  onPress?: (id: string) => void;
}

export function AppointmentCard({ 
  appointment, 
  onCheckIn, 
  onStartSession, 
  onPress 
}: AppointmentCardProps) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getStatusStyles = () => {
    switch (appointment.status) {
      case 'in_progress':
        return 'border-l-[3px] border-l-green border-warmGrey';
      case 'completed':
        return 'border-warmGrey opacity-60';
      case 'no_show':
        return 'border-warmGrey opacity-60';
      default:
        return 'border-warmGrey';
    }
  };

  const getTimeStyles = () => {
    return appointment.status === 'no_show' 
      ? 'text-bodyStrong text-midGrey line-through' 
      : 'text-bodyStrong text-charcoal';
  };

  const formatAppointmentType = (type: string) => {
    const typeMap: Record<string, string> = {
      'styling': 'Styling Session',
      'eye-exam': 'Eye Exam',
      'second-sight': 'Second Sight',
      'pickup': 'Pickup',
      'follow-up': 'Follow-up'
    };
    
    return typeMap[type] || type;
  };

  const getStatusBadge = () => {
    const badges = {
      scheduled: { text: 'Scheduled', style: 'bg-warmGrey text-charcoal' },
      confirmed: { text: 'Confirmed', style: 'bg-blue text-white' },
      in_progress: { text: 'In Progress', style: 'bg-green text-white' },
      completed: { text: 'Completed', style: 'bg-midGrey text-white' },
      no_show: { text: 'No Show', style: 'bg-error text-white' },
    };
    
    const badge = badges[appointment.status as keyof typeof badges];
    if (!badge) return null;
    
    return (
      <View className={`px-2 py-1 rounded-sm ${badge.style}`}>
        <Text className="text-captionStrong">{badge.text}</Text>
      </View>
    );
  };

  const showActionButtons = () => {
    if (privacyMode === 'client') return false;
    return appointment.status === 'scheduled' || 
           appointment.status === 'confirmed' || 
           appointment.status === 'in_progress';
  };

  const clientDisplay = privacyMode === 'client' 
    ? null 
    : appointment.clientName;

  return (
    <Pressable 
      onPress={() => onPress?.(appointment.id)}
      className={`bg-white rounded-lg border ${getStatusStyles()} p-md mb-sm`}
    >
      <View className="flex-row items-center justify-between mb-sm">
        <Text className={`${getTimeStyles()} font-mono`}>
          {formatTime(appointment.startsAt)}
        </Text>
        {getStatusBadge()}
      </View>
      
      {clientDisplay && (
        <Text className="text-headline text-charcoal mb-xs">
          {clientDisplay}
        </Text>
      )}
      
      <Text className="text-caption text-midGrey mb-sm">
        {formatAppointmentType(appointment.type)} • {appointment.duration} min
      </Text>
      
      {showActionButtons() && (
        <View className="flex-row gap-sm">
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && onCheckIn && (
            <Pressable 
              onPress={() => onCheckIn(appointment.id)}
              className="bg-navy px-lg py-sm rounded-md min-h-[44px] flex-1 items-center justify-center"
            >
              <Text className="text-bodyStrong text-white">Check In</Text>
            </Pressable>
          )}
          
          {appointment.status === 'in_progress' && onStartSession && (
            <Pressable 
              onPress={() => onStartSession(appointment.id)}
              className="bg-green px-lg py-sm rounded-md min-h-[44px] flex-1 items-center justify-center"
            >
              <Text className="text-bodyStrong text-white">Start Session</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}
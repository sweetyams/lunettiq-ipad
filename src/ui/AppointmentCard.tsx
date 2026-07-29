import { View, Text, Pressable } from 'react-native';
import { Appointment } from '@/src/api/appointments.types';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface AppointmentCardProps {
  appointment: Appointment;
  onMarkArrived?: (id: string) => void;
  onStartAppointment?: (id: string) => void;
  onStartSession?: (id: string) => void;
  onPress?: (id: string) => void;
  onLongPress?: () => void;
}

export function AppointmentCard({ 
  appointment, 
  onMarkArrived,
  onStartAppointment,
  onStartSession, 
  onPress,
  onLongPress,
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
      case 'arrived':
        return 'border-l-[3px] border-l-warning border-border';
      case 'in_progress':
        return 'border-l-[3px] border-l-green border-border';
      case 'completed':
        return 'border-border opacity-60';
      case 'no_show':
        return 'border-border opacity-60';
      default:
        return 'border-border';
    }
  };

  const getTimeStyles = () => {
    return appointment.status === 'no_show' 
      ? 'text-body-md font-medium text-text-muted line-through' 
      : 'text-body-md font-medium text-text-primary';
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
      scheduled: { text: 'Scheduled', style: 'bg-bg-surface text-text-primary' },
      confirmed: { text: 'Confirmed', style: 'bg-accent text-text-inverse' },
      arrived: { text: 'Arrived', style: 'bg-warning text-text-inverse' },
      in_progress: { text: 'In Progress', style: 'bg-accent text-text-inverse' },
      completed: { text: 'Completed', style: 'bg-muted text-text-inverse' },
      no_show: { text: 'No Show', style: 'bg-error text-text-inverse' },
    };
    
    const badge = badges[appointment.status as keyof typeof badges];
    if (!badge) return null;
    
    return (
      <View className={`px-2 py-1 rounded-sm ${badge.style}`}>
        <Text className="text-caption-md font-medium">{badge.text}</Text>
      </View>
    );
  };

  const showActionButtons = () => {
    if (privacyMode === 'client') return false;
    return appointment.status === 'scheduled' || 
           appointment.status === 'confirmed' || 
           appointment.status === 'arrived' ||
           appointment.status === 'in_progress';
  };

  const clientDisplay = privacyMode === 'client' 
    ? null 
    : appointment.clientName;

  return (
    <Pressable 
      onPress={() => onPress?.(appointment.id)}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatTime(appointment.startsAt)} appointment with ${appointment.clientName}, ${formatAppointmentType(appointment.type)}, status: ${appointment.status}`}
      className={`bg-bg-surface rounded-lg border ${getStatusStyles()} p-md mb-sm`}
    >
      <View className="flex-row items-center justify-between mb-sm">
        <Text className={`${getTimeStyles()} font-mono`}>
          {formatTime(appointment.startsAt)}
        </Text>
        {getStatusBadge()}
      </View>
      
      {clientDisplay && (
        <Text className="text-heading-xl text-text-primary mb-xs">
          {clientDisplay}
        </Text>
      )}
      
      <Text className="text-caption-md text-text-muted mb-sm">
        {formatAppointmentType(appointment.type)} • {appointment.duration} min
      </Text>
      
      {showActionButtons() && (
        <View className="flex-row gap-sm">
          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && onMarkArrived && (
            <Pressable 
              onPress={() => onMarkArrived(appointment.id)}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${appointment.clientName} as arrived`}
              className="bg-brand px-lg py-sm rounded-md min-h-[44px] flex-1 items-center justify-center"
            >
              <Text className="text-body-md font-medium text-text-inverse">Arrived</Text>
            </Pressable>
          )}

          {appointment.status === 'arrived' && onStartAppointment && (
            <Pressable 
              onPress={() => onStartAppointment(appointment.id)}
              accessibilityRole="button"
              accessibilityLabel={`Start appointment with ${appointment.clientName}`}
              className="bg-brand px-lg py-sm rounded-md min-h-[44px] flex-1 items-center justify-center"
            >
              <Text className="text-body-md font-medium text-text-inverse">Start</Text>
            </Pressable>
          )}
          
          {appointment.status === 'in_progress' && onStartSession && (
            <Pressable 
              onPress={() => onStartSession(appointment.id)}
              accessibilityRole="button"
              accessibilityLabel={`Start session with ${appointment.clientName}`}
              className="bg-accent px-lg py-sm rounded-md min-h-[44px] flex-1 items-center justify-center"
            >
              <Text className="text-body-md font-medium text-text-inverse">Start Session</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}
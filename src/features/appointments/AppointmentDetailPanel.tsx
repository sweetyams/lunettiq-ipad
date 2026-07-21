import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useMemo } from 'react';
import {
  Clock,
  Calendar,
  Bell,
  Package,
  FileText,
  UserCheck,
  XCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Appointment } from '@/src/api/appointments.types';
import { useAppointmentHolds } from '@/src/api/useAppointments';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface AppointmentDetailPanelProps {
  appointment: Appointment;
  onCheckIn: (id: string) => void;
  onStartSession: (id: string) => void;
  onMarkNoShow: (id: string) => void;
}

export function AppointmentDetailPanel({
  appointment,
  onCheckIn,
  onStartSession,
  onMarkNoShow,
}: AppointmentDetailPanelProps) {
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: holds } = useAppointmentHolds(appointment.id);

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

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const statusConfig = useMemo(() => {
    const configs: Record<string, { label: string; color: string; textColor: string }> = {
      scheduled: { label: 'Scheduled', color: 'bg-bg-surface border border-border', textColor: 'text-text-primary' },
      confirmed: { label: 'Confirmed', color: 'bg-info', textColor: 'text-text-inverse' },
      in_progress: { label: 'In Progress', color: 'bg-success', textColor: 'text-text-inverse' },
      completed: { label: 'Completed', color: 'bg-muted', textColor: 'text-text-inverse' },
      no_show: { label: 'No Show', color: 'bg-error', textColor: 'text-text-inverse' },
      cancelled: { label: 'Cancelled', color: 'bg-border', textColor: 'text-text-muted' },
    };
    return configs[appointment.status] ?? { label: 'Unknown', color: 'bg-bg-surface border border-border', textColor: 'text-text-primary' };
  }, [appointment.status]);

  const typeLabel = useMemo(() => {
    const typeMap: Record<string, string> = {
      styling: 'Styling Session',
      'eye-exam': 'Eye Exam',
      'second-sight': 'Second Sight',
      pickup: 'Pickup',
      'follow-up': 'Follow-up',
    };
    return typeMap[appointment.type] ?? appointment.type;
  }, [appointment.type]);

  const intakeHint = useMemo(() => {
    switch (appointment.intakeFormType) {
      case 'eye-exam':
        return 'Verify prescription on file after check-in';
      case 'styling':
        return 'Load preferences and fit profile after check-in';
      case 'second-sight':
        return 'Start Second Sight intake flow after check-in';
      default:
        return null;
    }
  }, [appointment.intakeFormType]);

  const canCheckIn =
    appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canStartSession = appointment.status === 'in_progress';
  const canMarkNoShow =
    appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const isTerminal =
    appointment.status === 'completed' ||
    appointment.status === 'no_show' ||
    appointment.status === 'cancelled';

  const handleNoShowPress = () => {
    Alert.alert(
      'Mark as No-Show',
      `Mark ${appointment.clientName ?? 'this client'} as a no-show?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark No-Show',
          style: 'destructive',
          onPress: () => onMarkNoShow(appointment.id),
        },
      ]
    );
  };

  const handleViewProfile = () => {
    if (appointment.clientId) {
      router.push(`/clients/${appointment.clientId}`);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-xl">
        <View className="flex-1">
          <Text className="text-displayMd text-text-primary">
            {appointment.clientName ?? 'Walk-in'}
          </Text>
          <Text className="text-body text-text-muted mt-xs">{typeLabel}</Text>
        </View>
        <View className={`px-md py-sm rounded-md ${statusConfig.color}`}>
          <Text className={`text-captionStrong ${statusConfig.textColor}`}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Intake hint */}
      {intakeHint && canStartSession && (
        <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg flex-row items-center gap-sm">
          <FileText color="#737373" size={16} />
          <Text className="text-body text-text-muted flex-1">{intakeHint}</Text>
        </View>
      )}

      {/* Details grid */}
      <View className="border border-border rounded-lg mb-lg">
        <DetailRow
          icon={<Clock color="#737373" size={18} />}
          label="Time"
          value={`${formatTime(appointment.startsAt)} – ${formatTime(appointment.endsAt)} (${appointment.duration} min)`}
        />
        <DetailRow
          icon={<Calendar color="#737373" size={18} />}
          label="Date"
          value={formatDateTime(appointment.startsAt).split(',')[0] + ', ' + formatDateTime(appointment.startsAt).split(',').slice(1).join(',')}
        />
        {appointment.staffName && (
          <DetailRow
            icon={<UserCheck color="#737373" size={18} />}
            label="Staff"
            value={appointment.staffName}
          />
        )}
        {appointment.reminderSentAt && (
          <DetailRow
            icon={<Bell color="#737373" size={18} />}
            label="Reminder"
            value={`Sent ${formatDateTime(appointment.reminderSentAt)}${appointment.reminderPreference ? ` via ${appointment.reminderPreference}` : ''}`}
          />
        )}
      </View>

      {/* Inventory holds */}
      {holds && holds.length > 0 && privacyMode === 'staff' && (
        <View className="border border-border rounded-lg mb-lg p-md">
          <View className="flex-row items-center gap-sm mb-md">
            <Package color="#737373" size={18} />
            <Text className="text-captionStrong text-text-muted uppercase tracking-wide">
              Frames Held ({holds.length})
            </Text>
          </View>
          {holds.map((hold) => (
            <View key={hold.id} className="flex-row items-center py-sm border-b border-border last:border-b-0">
              <Text className="text-body text-text-primary flex-1">
                {hold.productName}
              </Text>
              {hold.variantTitle && (
                <Text className="text-caption text-text-muted">{hold.variantTitle}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {appointment.notes && privacyMode === 'staff' && (
        <View className="border border-border rounded-lg mb-lg p-md">
          <Text className="text-captionStrong text-text-muted uppercase tracking-wide mb-sm">
            Notes
          </Text>
          <Text className="text-body text-text-primary">{appointment.notes}</Text>
        </View>
      )}

      {/* Actions */}
      {!isTerminal && (
        <View className="gap-sm">
          {canCheckIn && (
            <Pressable
              onPress={() => onCheckIn(appointment.id)}
              className="bg-brand rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Check in client"
            >
              <Text className="text-brand-text text-bodyStrong">Check In</Text>
            </Pressable>
          )}

          {canStartSession && (
            <Pressable
              onPress={() => onStartSession(appointment.id)}
              className="bg-success rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Start session"
            >
              <Text className="text-text-inverse text-bodyStrong">Start Session</Text>
            </Pressable>
          )}

          {appointment.clientId && (
            <Pressable
              onPress={handleViewProfile}
              className="border border-border rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="View client profile"
            >
              <Text className="text-text-primary text-bodyStrong">View Profile</Text>
            </Pressable>
          )}

          {canMarkNoShow && (
            <Pressable
              onPress={handleNoShowPress}
              className="py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Mark as no-show"
            >
              <Text className="text-destructive text-bodyStrong">Mark No-Show</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Terminal state messaging */}
      {isTerminal && (
        <View className="bg-bg-surface border border-border rounded-lg p-lg items-center">
          {appointment.status === 'completed' && (
            <Text className="text-body text-text-muted">Session completed</Text>
          )}
          {appointment.status === 'no_show' && (
            <>
              <XCircle color="#DC2626" size={24} />
              <Text className="text-body text-text-muted mt-sm">Marked as no-show</Text>
            </>
          )}
          {appointment.status === 'cancelled' && (
            <Text className="text-body text-text-muted">Appointment cancelled</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// --- Helper component ---

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center px-md py-md border-b border-border last:border-b-0">
      <View className="mr-md">{icon}</View>
      <Text className="text-body text-text-muted w-[80px]">{label}</Text>
      <Text className="text-bodyStrong text-text-primary flex-1">{value}</Text>
    </View>
  );
}

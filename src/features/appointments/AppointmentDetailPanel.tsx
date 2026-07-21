import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useMemo, useState } from 'react';
import {
  Clock,
  Calendar,
  Bell,
  Package,
  FileText,
  UserCheck,
  XCircle,
  Edit,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Appointment } from '@/src/api/appointments.types';
import { 
  useAppointmentHolds,
  useCompleteAppointment,
  useCancelAppointment,
  useConfirmAppointment,
} from '@/src/api/useAppointments';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { toast } from '@/src/ui/useToastStore';
import { EditAppointmentSheet } from './EditAppointmentSheet';

interface AppointmentDetailPanelProps {
  appointment: Appointment;
  onCheckIn: (id: string) => void;
  onStartSession: (id: string) => void;
  onMarkNoShow: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancelled?: () => void;
}

export function AppointmentDetailPanel({
  appointment,
  onCheckIn,
  onStartSession,
  onMarkNoShow,
  onEdit,
  onCancelled,
}: AppointmentDetailPanelProps) {
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: holds } = useAppointmentHolds(appointment.id);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const completeAppointment = useCompleteAppointment();
  const cancelAppointment = useCancelAppointment();
  const confirmAppointment = useConfirmAppointment();

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
      completed: { label: 'Completed', color: 'bg-bg-muted', textColor: 'text-text-inverse' },
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
  const canConfirm = appointment.status === 'scheduled';
  const canComplete = appointment.status === 'in_progress' || appointment.status === 'confirmed';
  const isTerminal =
    appointment.status === 'completed' ||
    appointment.status === 'no_show' ||
    appointment.status === 'cancelled';

  const handleCompletePress = () => {
    completeAppointment.mutate(appointment.id, {
      onSuccess: () => {
        toast.success('Appointment completed');
      },
      onError: (error) => {
        toast.error('Failed to complete appointment', error.message);
      },
    });
  };

  const handleConfirmPress = () => {
    confirmAppointment.mutate(appointment.id, {
      onSuccess: () => {
        toast.success('Appointment confirmed');
      },
      onError: (error) => {
        toast.error('Failed to confirm appointment', error.message);
      },
    });
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel ${appointment.clientName ?? 'this'} appointment?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: () => {
            cancelAppointment.mutate(appointment.id, {
              onSuccess: () => {
                toast.success('Appointment cancelled');
                onCancelled?.();
              },
              onError: (error) => {
                toast.error('Failed to cancel appointment', error.message);
              },
            });
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    if (onEdit) {
      onEdit(appointment.id);
    } else {
      setShowEditSheet(true);
    }
  };

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
          <Text className="text-display-md text-text-primary">
            {appointment.clientName ?? 'Walk-in'}
          </Text>
          <Text className="text-heading-sm text-text-secondary mt-xs font-medium">{typeLabel}</Text>
          {appointment.duration && (
            <Text className="text-body-sm text-text-muted mt-xs">
              {appointment.duration} minutes
            </Text>
          )}
        </View>
        <View className="items-end gap-sm">
          <View className={`px-md py-sm rounded-md ${statusConfig.color}`}>
            <Text className={`text-caption-md font-medium ${statusConfig.textColor}`}>
              {statusConfig.label}
            </Text>
          </View>
          {!isTerminal && (
            <Pressable
              onPress={handleEditPress}
              className="border border-border rounded-md p-sm min-w-[44px] min-h-[44px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Edit appointment"
            >
              <Edit color="#737373" size={18} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Intake hint */}
      {intakeHint && canStartSession && (
        <View className="bg-bg-surface border border-border rounded-lg p-md mb-lg flex-row items-center gap-sm">
          <FileText color="#737373" size={16} />
          <Text className="text-body-lg text-text-muted flex-1">{intakeHint}</Text>
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
            <Text className="text-caption-lg font-medium text-text-muted uppercase tracking-wide">
              Frames Held ({holds.length})
            </Text>
          </View>
          {holds.map((hold) => (
            <View key={hold.id} className="flex-row items-center py-sm border-b border-border last:border-b-0">
              <Text className="text-body-lg text-text-primary flex-1">
                {hold.productName}
              </Text>
              {hold.variantTitle && (
                <Text className="text-caption-md text-text-muted">{hold.variantTitle}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {appointment.notes && privacyMode === 'staff' && (
        <View className="border border-border rounded-lg mb-lg p-md">
          <Text className="text-caption-lg font-medium text-text-muted uppercase tracking-wide mb-sm">
            Notes
          </Text>
          <Text className="text-body-lg text-text-primary">{appointment.notes}</Text>
        </View>
      )}

      {/* Actions */}
      {!isTerminal && (
        <View className="gap-sm">
          {canComplete && (
            <Pressable
              onPress={handleCompletePress}
              disabled={completeAppointment.isPending}
              className="bg-success rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Complete appointment"
            >
              <Text className="text-text-inverse text-body-lg font-medium">
                {completeAppointment.isPending ? 'Completing...' : 'Complete'}
              </Text>
            </Pressable>
          )}

          {canConfirm && (
            <Pressable
              onPress={handleConfirmPress}
              disabled={confirmAppointment.isPending}
              className="bg-brand rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Confirm appointment"
            >
              <Text className="text-brand-text text-body-lg font-medium">
                {confirmAppointment.isPending ? 'Confirming...' : 'Confirm'}
              </Text>
            </Pressable>
          )}

          {canCheckIn && (
            <Pressable
              onPress={() => onCheckIn(appointment.id)}
              className={`${canConfirm ? 'border border-border' : 'bg-brand'} rounded-lg py-md items-center min-h-[44px] justify-center`}
              accessibilityRole="button"
              accessibilityLabel="Check in client"
            >
              <Text className={`${canConfirm ? 'text-text-primary' : 'text-brand-text'} text-body-lg font-medium`}>
                Check In
              </Text>
            </Pressable>
          )}

          {canStartSession && (
            <Pressable
              onPress={() => onStartSession(appointment.id)}
              className="bg-success rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Start session"
            >
              <Text className="text-text-inverse text-body-lg font-medium">Start Session</Text>
            </Pressable>
          )}

          {appointment.clientId && (
            <Pressable
              onPress={handleViewProfile}
              className="border border-border rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="View client profile"
            >
              <Text className="text-text-primary text-body-lg font-medium">View Profile</Text>
            </Pressable>
          )}

          {!isTerminal && (
            <Pressable
              onPress={handleEditPress}
              className="border border-border rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Edit appointment"
            >
              <Text className="text-text-primary text-body-lg font-medium">Edit appointment</Text>
            </Pressable>
          )}

          {canMarkNoShow && (
            <Pressable
              onPress={handleNoShowPress}
              className="py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Mark as no-show"
            >
              <Text className="text-error text-body-lg font-medium">Mark No-Show</Text>
            </Pressable>
          )}

          {!isTerminal && (
            <Pressable
              onPress={handleCancelPress}
              disabled={cancelAppointment.isPending}
              className="py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Cancel appointment"
            >
              <Text className="text-error text-body-lg font-medium">
                {cancelAppointment.isPending ? 'Cancelling...' : 'Cancel appointment'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Terminal state messaging */}
      {isTerminal && (
        <View className="bg-bg-surface border border-border rounded-lg p-lg items-center">
          {appointment.status === 'completed' && (
            <Text className="text-body-lg text-text-muted">Session completed</Text>
          )}
          {appointment.status === 'no_show' && (
            <>
              <XCircle color="#DC2626" size={24} />
              <Text className="text-body-lg text-text-muted mt-sm">Marked as no-show</Text>
            </>
          )}
          {appointment.status === 'cancelled' && (
            <Text className="text-body-lg text-text-muted">Appointment cancelled</Text>
          )}
        </View>
      )}

      {/* EditAppointmentSheet */}
      <EditAppointmentSheet
        visible={showEditSheet}
        appointment={appointment}
        onClose={() => setShowEditSheet(false)}
        onSaved={() => setShowEditSheet(false)}
      />
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
      <Text className="text-body-lg text-text-muted w-[80px]">{label}</Text>
      <Text className="text-body-lg font-medium text-text-primary flex-1">{value}</Text>
    </View>
  );
}

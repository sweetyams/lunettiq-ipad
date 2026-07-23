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
  CheckCircle,
  Send,
  Users,
  Eye,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Appointment } from '@/src/api/appointments.types';
import { 
  useAppointmentHolds,
  useCompleteAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useSendReminder,
  useClientAppointments,
} from '@/src/api/useAppointments';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { toast } from '@/src/ui/useToastStore';
import { EditAppointmentSheet } from './EditAppointmentSheet';

interface AppointmentDetailPanelProps {
  appointment: Appointment;
  onMarkArrived: (id: string) => void;
  onStartAppointment: (id: string) => void;
  onStartSession: (id: string) => void;
  onMarkNoShow: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancelled?: () => void;
}

export function AppointmentDetailPanel({
  appointment,
  onMarkArrived,
  onStartAppointment,
  onStartSession,
  onMarkNoShow,
  onEdit,
  onCancelled,
}: AppointmentDetailPanelProps) {
  const router = useRouter();
  const privacyMode = usePrivacyStore((s) => s.mode);
  const { data: holds } = useAppointmentHolds(appointment.id);
  const { data: clientAppointments } = useClientAppointments(appointment.clientId);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const completeAppointment = useCompleteAppointment();
  const cancelAppointment = useCancelAppointment();
  const confirmAppointment = useConfirmAppointment();
  const sendReminder = useSendReminder();

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

  const isAppointmentTomorrowOrLater = useMemo(() => {
    try {
      const appointmentDate = new Date(appointment.startsAt);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= tomorrow;
    } catch {
      return false;
    }
  }, [appointment.startsAt]);

  const canSendReminder = !appointment.reminderSentAt && isAppointmentTomorrowOrLater;

  const statusConfig = useMemo(() => {
    const configs: Record<string, { label: string; color: string; textColor: string }> = {
      scheduled: { label: 'Scheduled', color: 'bg-bg-surface border border-border', textColor: 'text-text-primary' },
      confirmed: { label: 'Confirmed', color: 'bg-info', textColor: 'text-text-inverse' },
      arrived: { label: 'Arrived', color: 'bg-warning', textColor: 'text-text-inverse' },
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

  const canMarkArrived =
    appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canStartAppointment = appointment.status === 'arrived';
  const canStartSession = appointment.status === 'in_progress';
  const canMarkNoShow =
    appointment.status === 'scheduled' || appointment.status === 'confirmed';
  const canConfirm = appointment.status === 'scheduled';
  const canComplete = appointment.status === 'in_progress' || appointment.status === 'arrived';
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

  const handleSendReminder = () => {
    sendReminder.mutate(appointment.id, {
      onSuccess: (response) => {
        toast.success(`Reminder sent via ${response.channel}`);
      },
      onError: (error) => {
        toast.error('Failed to send reminder', error.message);
      },
    });
  };

  const handleIntakeAction = () => {
    switch (appointment.intakeFormType) {
      case 'eye-exam':
        toast.info('Eye exam flow coming soon');
        break;
      case 'styling':
        if (appointment.clientId) {
          router.push(`/clients/${appointment.clientId}`);
        }
        break;
      case 'second-sight':
        router.push('/more/second-sight');
        break;
    }
  };

  const getIntakeButtonText = () => {
    switch (appointment.intakeFormType) {
      case 'eye-exam':
        return 'Start eye exam intake';
      case 'styling':
        return 'Load preferences';
      case 'second-sight':
        return 'Start Second Sight';
      default:
        return 'Start intake';
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

      {/* Intake CTA */}
      {appointment.intakeFormType && canStartSession && (
        <Pressable
          onPress={handleIntakeAction}
          className="bg-color-bg-surface border-l-4 border-color-brand border border-border rounded-lg p-md mb-lg flex-row items-center gap-sm min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel={getIntakeButtonText()}
        >
          <FileText color="#000EC7" size={20} />
          <Text className="text-body-lg text-text-primary flex-1 font-medium">{getIntakeButtonText()}</Text>
        </Pressable>
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

      {/* Reminder Status */}
      {privacyMode === 'staff' && (
        <View className="border border-border rounded-lg mb-lg p-md">
          <View className="flex-row items-center gap-sm mb-md">
            <Bell color="#737373" size={18} />
            <Text className="text-caption-lg font-medium text-text-muted uppercase tracking-wide">
              Reminder Status
            </Text>
          </View>
          {appointment.reminderSentAt ? (
            <View className="flex-row items-center gap-sm">
              <CheckCircle color="#16A34A" size={16} />
              <Text className="text-body-lg text-text-primary flex-1">
                Reminder sent {formatDateTime(appointment.reminderSentAt)}
                {appointment.reminderPreference && ` via ${appointment.reminderPreference}`}
              </Text>
            </View>
          ) : canSendReminder ? (
            <Pressable
              onPress={handleSendReminder}
              disabled={sendReminder.isPending}
              className="bg-color-brand rounded-md py-sm px-md flex-row items-center gap-sm justify-center min-h-[44px]"
              accessibilityRole="button"
              accessibilityLabel="Send appointment reminder"
            >
              <Send color="#FFFFFF" size={16} />
              <Text className="text-color-brand-text text-body-lg font-medium">
                {sendReminder.isPending ? 'Sending...' : 'Send reminder'}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-body-lg text-text-muted">
              Reminder will be sent automatically
            </Text>
          )}
        </View>
      )}

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

      {/* Client Appointment History */}
      {appointment.clientId && clientAppointments && clientAppointments.length > 0 && privacyMode === 'staff' && (
        <View className="border border-border rounded-lg mb-lg p-md">
          <View className="flex-row items-center justify-between mb-md">
            <View className="flex-row items-center gap-sm">
              <Users color="#737373" size={18} />
              <Text className="text-caption-lg font-medium text-text-muted uppercase tracking-wide">
                Recent Appointments
              </Text>
            </View>
            {clientAppointments.length > 5 && (
              <Pressable
                onPress={handleViewProfile}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="View all appointments"
              >
                <Text className="text-color-brand text-caption-lg font-medium">View all</Text>
              </Pressable>
            )}
          </View>
          {clientAppointments.slice(0, 5).map((appt) => (
            <View key={appt.id} className="flex-row items-center py-sm border-b border-border last:border-b-0">
              <Text className="text-body-lg text-text-primary w-20">
                {formatDateTime(appt.startsAt).split(',')[0]}
              </Text>
              <Text className="text-body-lg text-text-secondary flex-1 ml-md">
                {appt.type === 'styling' ? 'Styling' : 
                 appt.type === 'eye-exam' ? 'Eye Exam' : 
                 appt.type === 'second-sight' ? 'Second Sight' :
                 appt.type === 'pickup' ? 'Pickup' :
                 appt.type === 'follow-up' ? 'Follow-up' : appt.type}
              </Text>
              <View className={`px-sm py-xs rounded ${
                appt.status === 'completed' ? 'bg-success' :
                appt.status === 'no_show' ? 'bg-error' :
                'bg-bg-muted'
              }`}>
                <Text className={`text-caption-sm font-medium ${
                  appt.status === 'completed' ? 'text-text-inverse' :
                  appt.status === 'no_show' ? 'text-text-inverse' :
                  'text-text-muted'
                }`}>
                  {appt.status === 'completed' ? 'Done' :
                   appt.status === 'no_show' ? 'No-show' :
                   appt.status}
                </Text>
              </View>
            </View>
          ))}
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

          {(canMarkArrived && !appointment.reminderSentAt) && (
            <Pressable
              onPress={() => sendReminder.mutate(appointment.id, {
                onSuccess: () => toast.success('Confirmation sent to client'),
                onError: (err) => toast.error('Failed to send confirmation', err.message),
              })}
              disabled={sendReminder.isPending}
              className="border border-color-border rounded-lg py-md items-center min-h-[44px] justify-center flex-row gap-sm"
              accessibilityRole="button"
              accessibilityLabel="Send appointment confirmation to client"
            >
              <Send color="#404040" size={18} />
              <Text className="text-color-text-primary text-body-lg font-medium">
                {sendReminder.isPending ? 'Sending...' : 'Send confirmation'}
              </Text>
            </Pressable>
          )}

          {canMarkArrived && (
            <Pressable
              onPress={() => onMarkArrived(appointment.id)}
              className={`${canConfirm ? 'border border-border' : 'bg-brand'} rounded-lg py-md items-center min-h-[44px] justify-center`}
              accessibilityRole="button"
              accessibilityLabel="Mark client as arrived"
            >
              <Text className={`${canConfirm ? 'text-text-primary' : 'text-brand-text'} text-body-lg font-medium`}>
                Arrived
              </Text>
            </Pressable>
          )}

          {canStartAppointment && (
            <Pressable
              onPress={() => onStartAppointment(appointment.id)}
              className="bg-brand rounded-lg py-md items-center min-h-[44px] justify-center"
              accessibilityRole="button"
              accessibilityLabel="Start appointment"
            >
              <Text className="text-brand-text text-body-lg font-medium">Start</Text>
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

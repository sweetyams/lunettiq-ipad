import { View, Text, Pressable } from 'react-native';
import type { Appointment } from '@/src/api/appointments.types';
import { Badge, Button, type BadgeTone } from '@/src/ui/kit';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  scheduled: { label: 'Scheduled', tone: 'outline' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  arrived: { label: 'Arrived', tone: 'warning' },
  in_progress: { label: 'In visit', tone: 'success' },
  completed: { label: 'Done', tone: 'neutral' },
  no_show: { label: 'No-show', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

function formatTime(iso: string): { time: string; period: string } {
  const d = new Date(iso);
  const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  // iOS separates "11:30" and "AM" with a narrow no-break space (U+202F), not a space.
  const [time, period] = t.split(/[\s\u202F\u00A0]+/);
  return { time: time ?? t, period: period ?? '' };
}

/**
 * One appointment on the Floor: time · client · service · status · one action.
 * Builder list row; no coloured edges, no full-width buttons.
 */
export function AppointmentRow({
  appointment, onMarkArrived, onStartVisit, onOpenVisit, onPress, onLongPress, first,
}: {
  appointment: Appointment;
  onMarkArrived: (id: string) => void;
  onStartVisit: (id: string) => void;
  onOpenVisit: (id: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  first?: boolean;
}) {
  const privacyMode = usePrivacyStore((s) => s.mode);
  const status = STATUS[appointment.status] ?? STATUS.scheduled!;
  const { time, period } = formatTime(appointment.startsAt);
  const done = appointment.status === 'completed' || appointment.status === 'no_show' || appointment.status === 'cancelled';

  // One action per row, and none in client-visible mode.
  let action: { label: string; onPress: () => void } | null = null;
  if (privacyMode !== 'client') {
    if (appointment.status === 'scheduled' || appointment.status === 'confirmed') {
      action = { label: 'Mark arrived', onPress: () => onMarkArrived(appointment.id) };
    } else if (appointment.status === 'arrived') {
      action = { label: 'Start visit', onPress: () => onStartVisit(appointment.id) };
    } else if (appointment.status === 'in_progress') {
      action = { label: 'Open visit', onPress: () => onOpenVisit(appointment.id) };
    }
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${time} ${period}, ${appointment.clientName ?? 'Client'}, ${appointment.type}, ${status.label}`}
    >
      {({ pressed }) => (
        <View className={`flex-row items-center gap-[20px] px-[20px] min-h-[76px] py-[12px] ${first ? '' : 'border-t border-border'} ${pressed ? 'bg-bg-subtle' : ''} ${done ? 'opacity-50' : ''}`}>
          <View className="w-[76px]">
            <Text className="text-heading-lg text-text-primary" style={{ fontVariant: ['tabular-nums'] }}>{time}</Text>
            <Text className="text-body-sm text-text-tertiary">{period}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-body-lg font-medium text-text-primary" numberOfLines={1}>{appointment.clientName ?? 'Client'}</Text>
            <Text className="text-body-sm text-text-tertiary mt-[2px]" numberOfLines={1}>
              {appointment.type}{appointment.duration ? ` · ${appointment.duration} min` : ''}
            </Text>
          </View>
          <Badge tone={status.tone} dot>{status.label}</Badge>
          <View className="w-[140px] items-end">
            {action ? <Button label={action.label} size="sm" variant="secondary" onPress={action.onPress} /> : null}
          </View>
        </View>
      )}
    </Pressable>
  );
}

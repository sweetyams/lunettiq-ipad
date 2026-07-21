import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { X, Clock, User, Calendar, FileText } from 'lucide-react-native';
import { Appointment, StaffMember, TimeSlot } from '@/src/api/appointments.types';
import { 
  useUpdateAppointmentDetails,
  useSchedulingStaff,
  useAvailableSlots,
} from '@/src/api/useAppointments';
import { toast } from '@/src/ui/useToastStore';

interface EditAppointmentSheetProps {
  visible: boolean;
  appointment: Appointment;
  onClose: () => void;
  onSaved: () => void;
}

export function EditAppointmentSheet({
  visible,
  appointment,
  onClose,
  onSaved,
}: EditAppointmentSheetProps) {
  const { height } = useWindowDimensions();
  
  // State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(appointment.staffId || '');
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-01'); // Will be updated on mount
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState<string>(appointment.notes || '');

  // API hooks
  const { data: staff, isLoading: staffLoading } = useSchedulingStaff();
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
    date: selectedDate,
    staffId: selectedStaffId,
    typeId: appointment.type,
  });
  const updateAppointment = useUpdateAppointmentDetails();

  // Set initial date from appointment
  useEffect(() => {
    if (appointment.startsAt) {
      const dateStr = new Date(appointment.startsAt).toISOString().split('T')[0] as string;
      setSelectedDate(dateStr);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0] as string);
    }
  }, [appointment.startsAt]);

  // Helper functions
  const formatTime = useCallback((isoString: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }, []);

  const handleSave = useCallback(() => {
    const updates: any = {};
    let hasChanges = false;

    // Check for staff change
    if (selectedStaffId !== appointment.staffId) {
      updates.staffId = selectedStaffId;
      hasChanges = true;
    }

    // Check for time change
    if (selectedSlot) {
      updates.startsAt = selectedSlot.startsAt;
      updates.endsAt = selectedSlot.endsAt;
      hasChanges = true;
    }

    // Check for notes change
    if (notes !== appointment.notes) {
      updates.notes = notes;
      hasChanges = true;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    updateAppointment.mutate(
      { id: appointment.id, data: updates },
      {
        onSuccess: () => {
          toast.success('Appointment updated');
          onSaved();
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to update appointment', error.message);
        },
      }
    );
  }, [
    appointment.id,
    appointment.staffId,
    appointment.notes,
    selectedStaffId,
    selectedSlot,
    notes,
    updateAppointment,
    onSaved,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    const hasUnsavedChanges = 
      selectedStaffId !== appointment.staffId ||
      selectedSlot !== null ||
      notes !== appointment.notes;

    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  }, [selectedStaffId, appointment.staffId, selectedSlot, notes, appointment.notes, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40"
        onPress={handleClose}
        accessibilityLabel="Close edit sheet"
      >
        {/* Sheet */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-bg-surface rounded-t-2xl"
          style={{ maxHeight: height * 0.8 }}
          accessible={false}
        >
          {/* Handle */}
          <View className="items-center pt-sm pb-xs">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-xl pb-md border-b border-border">
            <Text className="text-heading-lg font-semibold text-text-primary">
              Edit Appointment
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-[44px] h-[44px] items-center justify-center rounded-full bg-bg-muted"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color="#737373" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Staff Section */}
            <View className="px-xl pt-lg">
              <View className="flex-row items-center gap-sm mb-md">
                <User color="#737373" size={18} />
                <Text className="text-heading-sm text-text-primary font-medium">
                  Assigned Staff
                </Text>
              </View>
              <View className="gap-sm">
                {staffLoading ? (
                  <View className="bg-skeleton-bg rounded-md h-[44px]" />
                ) : (
                  staff?.map((member: StaffMember) => (
                    <Pressable
                      key={member.id}
                      onPress={() => setSelectedStaffId(member.id)}
                      className={`min-h-[44px] px-md py-sm rounded-md border flex-row items-center ${
                        selectedStaffId === member.id
                          ? 'bg-brand border-brand'
                          : 'bg-bg-page border-border'
                      }`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selectedStaffId === member.id }}
                    >
                      <Text
                        className={`text-body-lg ${
                          selectedStaffId === member.id
                            ? 'text-brand-text font-medium'
                            : 'text-text-primary'
                        }`}
                      >
                        {member.name}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>

            {/* Date Section */}
            <View className="px-xl pt-lg">
              <View className="flex-row items-center gap-sm mb-md">
                <Calendar color="#737373" size={18} />
                <Text className="text-heading-sm text-text-primary font-medium">
                  Date & Time
                </Text>
              </View>
              
              {/* Current date/time display */}
              <View className="bg-bg-muted rounded-md p-md mb-md">
                <Text className="text-caption-md text-text-muted uppercase tracking-wide mb-xs">
                  Current
                </Text>
                <Text className="text-body-lg text-text-primary">
                  {formatDate(selectedDate)} at {formatTime(appointment.startsAt)}
                </Text>
              </View>

              {/* Available slots */}
              {selectedStaffId && (
                <View className="gap-sm">
                  <Text className="text-caption-md text-text-muted uppercase tracking-wide">
                    Available Times
                  </Text>
                  {slotsLoading ? (
                    <View className="bg-skeleton-bg rounded-md h-[44px]" />
                  ) : slots && slots.length > 0 ? (
                    slots.map((slot: TimeSlot) => (
                      <Pressable
                        key={`${slot.startsAt}-${slot.endsAt}`}
                        onPress={() => setSelectedSlot(slot)}
                        className={`min-h-[44px] px-md py-sm rounded-md border flex-row items-center ${
                          selectedSlot?.startsAt === slot.startsAt
                            ? 'bg-brand border-brand'
                            : 'bg-bg-page border-border'
                        }`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selectedSlot?.startsAt === slot.startsAt }}
                      >
                        <Clock 
                          size={16} 
                          color={selectedSlot?.startsAt === slot.startsAt ? '#FFFFFF' : '#737373'} 
                          style={{ marginRight: 8 }} 
                        />
                        <Text
                          className={`text-body-lg ${
                            selectedSlot?.startsAt === slot.startsAt
                              ? 'text-brand-text font-medium'
                              : 'text-text-primary'
                          }`}
                        >
                          {formatTime(slot.startsAt)} - {formatTime(slot.endsAt)}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text className="text-body-lg text-text-muted text-center py-lg">
                      No available slots for selected staff
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Notes Section */}
            <View className="px-xl pt-lg">
              <View className="flex-row items-center gap-sm mb-md">
                <FileText color="#737373" size={18} />
                <Text className="text-heading-sm text-text-primary font-medium">
                  Notes
                </Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes for this appointment..."
                placeholderTextColor="#A3A3A3"
                multiline
                textAlignVertical="top"
                className="bg-bg-page border border-border rounded-md p-md text-body-lg text-text-primary min-h-[100px]"
                accessibilityLabel="Appointment notes"
              />
            </View>

            {/* Save Button */}
            <View className="px-xl pt-xl">
              <Pressable
                onPress={handleSave}
                disabled={updateAppointment.isPending}
                className="bg-brand rounded-lg py-md items-center min-h-[44px] justify-center"
                accessibilityRole="button"
                accessibilityLabel="Save changes"
              >
                <Text className="text-brand-text text-body-lg font-medium">
                  {updateAppointment.isPending ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
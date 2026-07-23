import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { UserPlus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useCreateAppointment, useCheckIn } from '@/src/api/useAppointments';
import { toast } from '@/src/ui/useToastStore';

interface WalkInButtonProps {
  onWalkInCreated?: (appointmentId: string) => void;
}

export function WalkInButton({ onWalkInCreated }: WalkInButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const createAppointment = useCreateAppointment();
  const checkIn = useCheckIn();
  const router = useRouter();

  const handlePress = () => {
    setShowConfirmation(true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleConfirm = async () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +60 minutes

    try {
      // Create the walk-in appointment
      const appointment = await createAppointment.mutateAsync({
        title: 'Walk-in',
        shopifyCustomerId: null,
        staffId: null,
        typeId: null, // No specific service type
        startsAt: now.toISOString(),
        endsAt: endTime.toISOString(),
        notes: null,
        locationId: null, // Will be set server-side
        source: 'tablet',
      });

      // Immediately check in the appointment
      await checkIn.mutateAsync(appointment.id);

      setShowConfirmation(false);
      toast.success('Walk-in started');
      
      // Callback to parent or navigate to client search
      if (onWalkInCreated) {
        onWalkInCreated(appointment.id);
      } else {
        // Navigate to client search to potentially link a client
        router.push('/clients?mode=link-appointment');
      }
    } catch (error) {
      toast.error('Failed to create walk-in', error instanceof Error ? error.message : 'Unknown error');
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="min-h-[44px] px-lg py-sm rounded-md border border-color-border bg-transparent flex-row items-center justify-center gap-sm"
        accessibilityRole="button"
        accessibilityLabel="Start a walk-in appointment now"
      >
        <UserPlus color="#404040" size={18} />
        <Text className="text-body-lg font-medium text-color-text-primary">
          Walk-In
        </Text>
      </Pressable>

      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 bg-color-overlay items-center justify-center px-xl">
          <View className="bg-color-bg-surface rounded-lg border border-color-border p-xl max-w-sm w-full">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-lg">
              <Text className="text-heading-md text-color-text-primary font-medium">
                Start Walk-In
              </Text>
              <Pressable
                onPress={handleCancel}
                className="min-h-[44px] min-w-[44px] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <X color="#737373" size={20} />
              </Pressable>
            </View>

            {/* Content */}
            <Text className="text-body-lg text-color-text-secondary mb-xl">
              Start a walk-in appointment now? You can link it to a client afterward.
            </Text>

            {/* Actions */}
            <View className="flex-row gap-md">
              <Pressable
                onPress={handleCancel}
                className="flex-1 min-h-[44px] items-center justify-center rounded-md border border-color-border"
                accessibilityRole="button"
                accessibilityLabel="Cancel walk-in"
              >
                <Text className="text-body-lg text-color-text-primary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                disabled={createAppointment.isPending || checkIn.isPending}
                className={`flex-1 min-h-[44px] items-center justify-center rounded-md ${
                  createAppointment.isPending || checkIn.isPending 
                    ? 'bg-color-bg-muted' 
                    : 'bg-color-brand'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Start walk-in now"
              >
                <Text className={`text-body-lg font-medium ${
                  createAppointment.isPending || checkIn.isPending
                    ? 'text-color-text-muted'
                    : 'text-color-brand-text'
                }`}>
                  {createAppointment.isPending || checkIn.isPending ? 'Starting...' : 'Start Now'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { CreateAppointmentSheet } from './CreateAppointmentSheet';

interface FollowUpBookingButtonProps {
  clientId: string;
  clientName?: string;
  variant?: 'primary' | 'ghost';
  serviceType?: 'follow-up' | 'pickup';
  suggestedNotes?: string;
  previousSessionId?: string;
}

export function FollowUpBookingButton({
  clientId,
  clientName,
  variant = 'ghost',
  serviceType = 'follow-up',
  suggestedNotes,
  previousSessionId,
}: FollowUpBookingButtonProps) {
  const [showSheet, setShowSheet] = useState(false);

  const handlePress = () => {
    setShowSheet(true);
  };

  const handleClose = () => {
    setShowSheet(false);
  };

  const buttonLabel = serviceType === 'pickup' 
    ? `Book pickup${clientName ? ` for ${clientName}` : ''}` 
    : `Book follow-up${clientName ? ` for ${clientName}` : ''}`;

  const buttonText = serviceType === 'pickup' ? 'Book Pickup' : 'Book Follow-Up';

  return (
    <>
      <Pressable
        onPress={handlePress}
        className={`min-h-[44px] px-lg py-sm rounded-md flex-row items-center justify-center gap-sm ${
          variant === 'primary' 
            ? 'bg-color-brand' 
            : 'border border-color-border bg-transparent'
        }`}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
      >
        <Calendar 
          color={variant === 'primary' ? '#FFFFFF' : '#404040'} 
          size={18} 
        />
        <Text 
          className={`text-body-lg font-medium ${
            variant === 'primary' 
              ? 'text-color-brand-text' 
              : 'text-color-text-primary'
          }`}
        >
          {buttonText}
        </Text>
      </Pressable>

      <CreateAppointmentSheet
        visible={showSheet}
        onClose={handleClose}
        preselectedClientId={clientId}
        preselectedServiceType={serviceType}
        followUpContext={{
          previousSessionId,
          suggestedNotes,
        }}
      />
    </>
  );
}
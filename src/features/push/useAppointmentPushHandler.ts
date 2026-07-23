import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

/**
 * Handles push notifications related to appointments.
 * When user taps a notification with appointment data, navigates to appointments
 * screen with the appointment pre-selected.
 *
 * Expected notification data shape:
 * { type: 'appointment', appointmentId: string, action?: 'arriving' | 'reminder' | 'status_change' }
 */
export function useAppointmentPushHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification tap (when app is in foreground or background)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'appointment' && data?.appointmentId) {
        // Navigate to appointments tab with the appointment ID as a param
        router.push(`/appointments?selected=${data.appointmentId}`);
      }
    });

    return () => subscription.remove();
  }, [router]);
}
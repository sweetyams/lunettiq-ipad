import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRegisterPush, useDeregisterPush } from '@/src/api/usePushRegistration';
import { toast } from '@/src/ui/useToastStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushSetup() {
  const { isSignedIn, getToken } = useAuth();
  const registerPush = useRegisterPush();
  const deregisterPush = useDeregisterPush();
  const expoPushTokenRef = useRef<string | null>(null);
  const hasRegisteredRef = useRef<boolean>(false);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    if (!isSignedIn || hasRegisteredRef.current) return;

    try {
      // Check if we have permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if we don't have it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      // Get the token
      // Requires EAS project ID — skip gracefully if not configured
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID ?? process.env.EAS_PROJECT_ID;
      if (!projectId) {
        if (__DEV__) {
          console.log('Push setup skipped: no EAS_PROJECT_ID configured');
        }
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const expoPushToken = tokenData.data;
      expoPushTokenRef.current = expoPushToken;

      // Get device name
      const deviceName = Application.applicationName || 'iPad';

      // Register with the backend
      await registerPush.mutateAsync({
        token: expoPushToken,
        platform: 'ios',
        deviceName,
      });

      hasRegisteredRef.current = true;
      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Failed to register push token:', error);
      // Only show user-facing error in production — in dev/simulator this is expected
      if (!__DEV__) {
        toast.error('Push notifications setup failed', 'You may miss important notifications');
      }
    }
  }, [isSignedIn, registerPush]);

  // Deregister push notifications
  const deregisterFromPushNotifications = useCallback(async () => {
    if (!hasRegisteredRef.current) return;

    try {
      await deregisterPush.mutateAsync();
      expoPushTokenRef.current = null;
      hasRegisteredRef.current = false;
      console.log('Push token deregistered successfully');
    } catch (error) {
      console.error('Failed to deregister push token:', error);
      // Don't show user error - this is cleanup on logout
    }
  }, [deregisterPush]);

  // Handle notification received while app is in foreground
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    const { title, body } = notification.request.content;
    
    if (title) {
      toast.info(title, body || undefined);
    }
  }, []);

  // Handle notification tapped (app was backgrounded/closed)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { title, body } = response.notification.request.content;
    console.log('Notification tapped:', { title, body });
    
    // Could navigate to specific screen based on notification data
    // For now, just show a toast
    if (title) {
      toast.info(`Opened from: ${title}`, body || undefined);
    }
  }, []);

  // Register when signed in, deregister when signed out
  useEffect(() => {
    if (isSignedIn) {
      // Delay registration slightly to ensure auth is fully ready
      const timer = setTimeout(registerForPushNotifications, 1000);
      return () => clearTimeout(timer);
    } else {
      deregisterFromPushNotifications();
    }
  }, [isSignedIn, registerForPushNotifications, deregisterFromPushNotifications]);

  // Set up notification listeners
  useEffect(() => {
    let foregroundSubscription: Notifications.Subscription | undefined;
    let responseSubscription: Notifications.Subscription | undefined;

    if (Platform.OS === 'ios') {
      // Listen for notifications received while app is in foreground
      foregroundSubscription = Notifications.addNotificationReceivedListener(
        handleNotificationReceived
      );

      // Listen for user tapping notifications
      responseSubscription = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );
    }

    return () => {
      foregroundSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  return {
    isRegistering: registerPush.isPending || deregisterPush.isPending,
    hasToken: hasRegisteredRef.current,
    token: expoPushTokenRef.current,
  };
}
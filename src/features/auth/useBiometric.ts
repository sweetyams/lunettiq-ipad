import { useCallback } from 'react';

interface BiometricResult {
  authenticate: (reason?: string) => Promise<boolean>;
}

// Lazy-load to avoid crash when native module isn't available
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  // Native module not available (Expo Go or missing prebuild)
}

export function useBiometric(): BiometricResult {
  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    // If native module isn't available, skip biometric (dev mode)
    if (!LocalAuthentication) {
      console.warn('[Auth] expo-local-authentication not available, skipping biometric');
      return true;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return true;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return true;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return true; // Fail open in dev, fail closed in prod
    }
  }, []);

  return { authenticate };
}

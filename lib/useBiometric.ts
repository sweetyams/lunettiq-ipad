import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometricLock() {
  const [locked, setLocked] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(setSupported);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && locked) authenticate();
      if (state === 'background') setLocked(true);
    });
    return () => sub.remove();
  }, [supported, locked]);

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Lunettiq', fallbackLabel: 'Use passcode' });
    if (result.success) setLocked(false);
  };

  return { locked, authenticate, supported };
}

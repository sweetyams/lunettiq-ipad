import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useDeviceSettings } from './useDeviceSettings';

interface AutoLockState {
  locked: boolean;
  unlock: () => void;
  /** Call this on any user interaction to reset the inactivity timer */
  resetActivity: () => void;
}

export function useAutoLock(): AutoLockState {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);

  const sessionMode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);
  const { pinSystemEnabled, lockTimeout } = useDeviceSettings();

  // Resolve timeout in ms ('never' = no timer)
  const timeoutMs = lockTimeout === 'never' ? null : lockTimeout * 60 * 1000;

  // Check if lock should be suppressed
  const suppressLock = !pinSystemEnabled || sessionMode === 'fitting' || handedToClient || timeoutMs === null;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (!suppressLock && timeoutMs) {
      timerRef.current = setTimeout(() => {
        setLocked(true);
      }, timeoutMs);
    }
  }, [suppressLock, timeoutMs, clearTimer]);

  const unlock = useCallback(() => {
    setLocked(false);
    startTimer();
  }, [startTimer]);

  /** Reset the inactivity timer — call on any touch/interaction */
  const resetActivity = useCallback(() => {
    if (!suppressLock && !locked) {
      startTimer();
    }
  }, [suppressLock, locked, startTimer]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        backgroundTimeRef.current = Date.now();
        clearTimer();
      } else if (nextAppState === 'active') {
        const backgroundTime = backgroundTimeRef.current;
        if (backgroundTime && !suppressLock && timeoutMs) {
          const timeInBackground = Date.now() - backgroundTime;
          if (timeInBackground >= timeoutMs) {
            setLocked(true);
          } else {
            startTimer();
          }
        }
        backgroundTimeRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startTimer();

    return () => {
      subscription.remove();
      clearTimer();
    };
  }, [suppressLock, timeoutMs, startTimer, clearTimer]);

  // React to changes in suppress conditions
  useEffect(() => {
    if (suppressLock) {
      clearTimer();
    } else if (!locked) {
      startTimer();
    }
  }, [suppressLock, locked, startTimer, clearTimer]);

  return { locked, unlock, resetActivity };
}

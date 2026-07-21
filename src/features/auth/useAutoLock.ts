import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';

interface AutoLockState {
  locked: boolean;
  unlock: () => void;
}

const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function useAutoLock(): AutoLockState {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);

  const sessionMode = useSessionStore((s) => s.mode);
  const handedToClient = usePrivacyStore((s) => s.handedToClient);

  // Check if lock should be suppressed
  const suppressLock = sessionMode === 'fitting' || handedToClient;

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!suppressLock) {
      timerRef.current = setTimeout(() => {
        setLocked(true);
      }, LOCK_TIMEOUT_MS);
    }
  };

  const unlock = () => {
    setLocked(false);
    resetTimer();
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        backgroundTimeRef.current = Date.now();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      } else if (nextAppState === 'active') {
        const backgroundTime = backgroundTimeRef.current;
        if (backgroundTime && !suppressLock) {
          const timeInBackground = Date.now() - backgroundTime;
          if (timeInBackground >= LOCK_TIMEOUT_MS) {
            setLocked(true);
          } else {
            resetTimer();
          }
        }
        backgroundTimeRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    resetTimer();

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [suppressLock]);

  // Reset timer when suppress conditions change
  useEffect(() => {
    if (suppressLock && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    } else if (!suppressLock && !timerRef.current && !locked) {
      resetTimer();
    }
  }, [suppressLock, locked]);

  return { locked, unlock };
}
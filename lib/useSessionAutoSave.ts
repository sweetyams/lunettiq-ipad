import { useEffect, useRef } from 'react';
import { useAppStore } from './store';
import type { Session } from './types';

/**
 * Auto-saves the current session state every 30s.
 * On app reopen, the session persists in zustand (in-memory for now).
 * For crash recovery, this would persist to AsyncStorage/SQLite.
 */
export function useSessionAutoSave(sessionData: Partial<Session> | null) {
  const { currentSession, updateSession } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionData) return;

    intervalRef.current = setInterval(() => {
      if (sessionData) {
        updateSession({ ...sessionData, endedAt: undefined });
      }
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionData]);

  return currentSession;
}

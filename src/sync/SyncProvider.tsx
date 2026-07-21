import React, { useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncEngine } from './SyncEngine';
import { PhotoUploadWorker } from './PhotoUploadWorker';
import { useSyncStore } from './useSyncStore';

// Singleton photo upload worker
const photoWorker = new PhotoUploadWorker();

// --- Connectivity Check ---

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://httpstat.us/200', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// --- Provider ---

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps): React.ReactElement {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    // Initial check
    checkConnectivity().then((online) => {
      useSyncStore.getState().setOnline(online);
      if (online) {
        // Drain any pending queue items on startup
        syncEngine.start();
        photoWorker.start();
      }
    });

    // Check every 30s
    intervalRef.current = setInterval(async () => {
      const prevOnline = useSyncStore.getState().isOnline;
      const online = await checkConnectivity();
      useSyncStore.getState().setOnline(online);

      // Detect offline → online transition — trigger sync
      if (online && !prevOnline) {
        console.log('[SyncProvider] Reconnected — draining sync queue and photo uploads');
        syncEngine.start();
        photoWorker.start();
      }

      // Track offline state for transition detection
      wasOfflineRef.current = !online;
    }, 30_000);

    // App state listener — recheck on foreground
    const sub = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active') {
        const online = await checkConnectivity();
        const prevOnline = useSyncStore.getState().isOnline;
        useSyncStore.getState().setOnline(online);

        // On returning to foreground while online, start sync
        if (online) {
          syncEngine.start();
          photoWorker.start();
        }
      } else if (state === 'background') {
        // Stop sync engine when backgrounded to save battery
        syncEngine.stop();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
      syncEngine.stop();
    };
  }, []);

  return <>{children}</>;
}

// Re-export the store for backward compatibility with existing imports
export { useSyncStore } from './useSyncStore';

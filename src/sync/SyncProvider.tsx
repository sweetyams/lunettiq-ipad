import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';

// --- Sync Store (inline to avoid import chain issues) ---

interface SyncState {
  isOnline: boolean;
  pendingWrites: number;
  lastSyncAt: number | null;
  setOnline: (isOnline: boolean) => void;
  setPendingWrites: (count: number) => void;
  setLastSyncAt: (timestamp: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  pendingWrites: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setPendingWrites: (count) => set({ pendingWrites: count }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
}));

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

  useEffect(() => {
    // Initial check
    checkConnectivity().then((online) => {
      useSyncStore.getState().setOnline(online);
    });

    // Check every 30s
    intervalRef.current = setInterval(async () => {
      const online = await checkConnectivity();
      useSyncStore.getState().setOnline(online);
    }, 30_000);

    // App state listener — recheck on foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnectivity().then((online) => {
          useSyncStore.getState().setOnline(online);
        });
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return <>{children}</>;
}

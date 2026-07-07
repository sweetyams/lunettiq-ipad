import React from 'react';
import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  pendingWrites: number;
  lastSyncAt: number | null;
  setOnline: (isOnline: boolean) => void;
  setPendingWrites: (count: number) => void;
  setLastSyncAt: (timestamp: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true, // Default to online
  pendingWrites: 0,
  lastSyncAt: null,
  
  setOnline: (isOnline) => set({ isOnline }),
  
  setPendingWrites: (count) => set({ pendingWrites: count }),
  
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
}));

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  // Store is standalone, provider just renders children
  // In the future, this could initialize network listeners
  return <>{children}</>;
}
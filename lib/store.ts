import { create } from 'zustand';
import { Session, SyncQueueItem } from './types';

interface AppState {
  currentSession: Session | null;
  syncQueue: SyncQueueItem[];
  isOnline: boolean;
  locationId: string;
  setSession: (session: Session | null) => void;
  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;
  setOnline: (online: boolean) => void;
  setLocationId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSession: null,
  syncQueue: [],
  isOnline: true,
  locationId: '',
  setSession: (session) => set({ currentSession: session }),
  addToSyncQueue: (item) => set((s) => ({ syncQueue: [...s.syncQueue, item] })),
  removeFromSyncQueue: (id) => set((s) => ({ syncQueue: s.syncQueue.filter((i) => i.id !== id) })),
  setOnline: (online) => set({ isOnline: online }),
  setLocationId: (id) => set({ locationId: id }),
}));

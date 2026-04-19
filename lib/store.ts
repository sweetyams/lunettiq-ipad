import { create } from 'zustand';
import { Session, SyncQueueItem } from './types';

interface PhotoUpload {
  id: string;
  localUri: string;
  clientId: string;
  sessionId: string;
  variantId?: string;
  status: 'pending' | 'uploading' | 'done' | 'failed';
}

interface HandoffEntry {
  fromStaffId: string;
  toStaffId: string;
  timestamp: string;
  clientId?: string;
}

interface AppState {
  // Session
  currentSession: Session | null;
  setSession: (session: Session | null) => void;
  updateSession: (updates: Partial<Session>) => void;

  // Sync
  syncQueue: SyncQueueItem[];
  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;

  // Network
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Location
  locationId: string;
  setLocationId: (id: string) => void;

  // Photo uploads
  photoQueue: PhotoUpload[];
  addPhoto: (photo: PhotoUpload) => void;
  updatePhotoStatus: (id: string, status: PhotoUpload['status']) => void;
  removePhoto: (id: string) => void;

  // Shift handoff
  handoffs: HandoffEntry[];
  addHandoff: (entry: HandoffEntry) => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSession: null,
  setSession: (session) => set({ currentSession: session }),
  updateSession: (updates) => set((s) => ({
    currentSession: s.currentSession ? { ...s.currentSession, ...updates } : null,
  })),

  syncQueue: [],
  addToSyncQueue: (item) => set((s) => ({ syncQueue: [...s.syncQueue, item] })),
  removeFromSyncQueue: (id) => set((s) => ({ syncQueue: s.syncQueue.filter((i) => i.id !== id) })),

  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),

  locationId: '',
  setLocationId: (id) => set({ locationId: id }),

  photoQueue: [],
  addPhoto: (photo) => set((s) => ({ photoQueue: [...s.photoQueue, photo] })),
  updatePhotoStatus: (id, status) => set((s) => ({
    photoQueue: s.photoQueue.map((p) => p.id === id ? { ...p, status } : p),
  })),
  removePhoto: (id) => set((s) => ({ photoQueue: s.photoQueue.filter((p) => p.id !== id) })),

  handoffs: [],
  addHandoff: (entry) => set((s) => ({ handoffs: [...s.handoffs, entry] })),
  currentStaffId: '',
  setCurrentStaffId: (id) => set({ currentStaffId: id }),
}));

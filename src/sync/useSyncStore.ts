import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface SyncError {
  id: string;
  message: string;
  timestamp: number;
  type: 'network' | 'auth' | 'server' | 'client' | 'unknown';
}

interface SyncState {
  // Connectivity
  isOnline: boolean;
  isConnectedToWifi: boolean;
  connectionType: 'wifi' | 'cellular' | 'none';
  
  // Queue status
  pendingWrites: number;
  pendingUploads: number;
  
  // Sync timing
  lastSyncAt: number | null;
  lastFullSyncAt: number | null;
  lastConnectivityCheckAt: number | null;
  
  // Status
  syncStatus: 'idle' | 'syncing' | 'uploading' | 'error';
  errors: SyncError[];
  
  // Settings
  wifiOnlyUploads: boolean;
  autoSyncEnabled: boolean;
  
  // Actions
  setOnline: (online: boolean) => void;
  setConnectionType: (type: SyncState['connectionType']) => void;
  setWifiConnection: (isWifi: boolean) => void;
  setPendingWrites: (count: number) => void;
  setPendingUploads: (count: number) => void;
  setSyncStatus: (status: SyncState['syncStatus']) => void;
  setLastSyncAt: (timestamp: number) => void;
  setLastFullSyncAt: (timestamp: number) => void;
  setLastConnectivityCheckAt: (timestamp: number) => void;
  addError: (error: Omit<SyncError, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  removeError: (id: string) => void;
  setWifiOnlyUploads: (enabled: boolean) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const generateErrorId = (): string => Math.random().toString(36).substring(2);

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: false,
      isConnectedToWifi: false,
      connectionType: 'none',
      pendingWrites: 0,
      pendingUploads: 0,
      lastSyncAt: null,
      lastFullSyncAt: null,
      lastConnectivityCheckAt: null,
      syncStatus: 'idle',
      errors: [],
      wifiOnlyUploads: true, // Conservative default
      autoSyncEnabled: true,
      
      // Actions
      setOnline: (online) => set({ isOnline: online }),
      
      setConnectionType: (type) => set({ 
        connectionType: type,
        isConnectedToWifi: type === 'wifi',
        isOnline: type !== 'none'
      }),
      
      setWifiConnection: (isWifi) => set({ isConnectedToWifi: isWifi }),
      
      setPendingWrites: (count) => set({ pendingWrites: Math.max(0, count) }),
      
      setPendingUploads: (count) => set({ pendingUploads: Math.max(0, count) }),
      
      setSyncStatus: (status) => set({ syncStatus: status }),
      
      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
      
      setLastFullSyncAt: (timestamp) => set({ lastFullSyncAt: timestamp }),
      
      setLastConnectivityCheckAt: (timestamp) => set({ lastConnectivityCheckAt: timestamp }),
      
      addError: (errorData) => {
        const error: SyncError = {
          id: generateErrorId(),
          timestamp: Date.now(),
          ...errorData,
        };
        
        set((state) => ({
          errors: [error, ...state.errors].slice(0, 10), // Keep last 10 errors
        }));
      },
      
      clearErrors: () => set({ errors: [] }),
      
      removeError: (id) => set((state) => ({
        errors: state.errors.filter(e => e.id !== id),
      })),
      
      setWifiOnlyUploads: (enabled) => set({ wifiOnlyUploads: enabled }),
      
      setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),
      
      reset: () => set({
        isOnline: false,
        isConnectedToWifi: false,
        connectionType: 'none',
        pendingWrites: 0,
        pendingUploads: 0,
        syncStatus: 'idle',
        errors: [],
        // Don't reset settings or timestamps
      }),
    }),
    {
      name: 'sync-store',
      storage: createJSONStorage(() => ({
        setItem: (name, value) => {
          storage.set(name, value);
        },
        getItem: (name) => {
          return storage.getString(name) ?? null;
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      })),
      // Only persist certain keys
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
        lastFullSyncAt: state.lastFullSyncAt,
        wifiOnlyUploads: state.wifiOnlyUploads,
        autoSyncEnabled: state.autoSyncEnabled,
      }),
    }
  )
);

// Utility selectors
export const useIsOnline = (): boolean => useSyncStore(state => state.isOnline);
export const useSyncStatus = (): SyncState['syncStatus'] => useSyncStore(state => state.syncStatus);
export const usePendingCounts = (): { writes: number; uploads: number } => 
  useSyncStore(state => ({ writes: state.pendingWrites, uploads: state.pendingUploads }));
export const useHasPendingWork = (): boolean => 
  useSyncStore(state => state.pendingWrites > 0 || state.pendingUploads > 0);
export const useSyncErrors = (): SyncError[] => useSyncStore(state => state.errors);
export const useCanUpload = (): boolean => 
  useSyncStore(state => state.isOnline && (!state.wifiOnlyUploads || state.isConnectedToWifi));
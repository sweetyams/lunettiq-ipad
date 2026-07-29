import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// --- Types ---

export type LockTimeout = 2 | 5 | 10 | 'never';

interface DeviceSettingsState {
  /** Whether the PIN lock system is active (multi-staff mode). Default: true */
  pinSystemEnabled: boolean;
  /** Inactivity timeout before PIN lock engages (minutes). Default: 2 */
  lockTimeout: LockTimeout;
}

interface DeviceSettingsActions {
  setPinSystemEnabled: (enabled: boolean) => void;
  setLockTimeout: (timeout: LockTimeout) => void;
}

// --- MMKV Storage ---

const storage = new MMKV({ id: 'device-settings' });

const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// --- Store ---

export const useDeviceSettings = create<DeviceSettingsState & DeviceSettingsActions>()(
  persist(
    (set) => ({
      pinSystemEnabled: true,
      lockTimeout: 2,

      setPinSystemEnabled: (enabled: boolean) => {
        set({ pinSystemEnabled: enabled });
      },

      setLockTimeout: (timeout: LockTimeout) => {
        set({ lockTimeout: timeout });
      },
    }),
    {
      name: 'device-settings',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

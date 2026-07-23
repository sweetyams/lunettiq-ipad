import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// --- Types ---

export interface Operator {
  staffId: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string | null;
}

export interface OperatorState {
  deviceOwnerId: string | null;
  activeOperator: Operator | null;
  authenticatedAt: number | null;
  roster: Operator[];
  rosterFetchedAt: number | null;
}

interface OperatorActions {
  setDeviceOwner: (clerkUserId: string) => void;
  switchOperator: (operator: Operator) => void;
  clearOperator: () => void;
  setRoster: (roster: Operator[]) => void;
  isDeviceOwner: () => boolean;
  isSwitched: () => boolean;
}

// --- MMKV Storage ---

const storage = new MMKV({ id: 'operator-store' });

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

const INITIAL_STATE: OperatorState = {
  deviceOwnerId: null,
  activeOperator: null,
  authenticatedAt: null,
  roster: [],
  rosterFetchedAt: null,
};

export const useOperatorStore = create<OperatorState & OperatorActions>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setDeviceOwner: (clerkUserId: string) => {
        set({ deviceOwnerId: clerkUserId });
      },

      switchOperator: (operator: Operator) => {
        set({
          activeOperator: operator,
          authenticatedAt: Date.now(),
        });
      },

      clearOperator: () => {
        set({
          activeOperator: null,
          authenticatedAt: null,
        });
      },

      setRoster: (roster: Operator[]) => {
        set({
          roster,
          rosterFetchedAt: Date.now(),
        });
      },

      isDeviceOwner: (): boolean => {
        const { activeOperator, deviceOwnerId } = get();
        return activeOperator === null || activeOperator.clerkUserId === deviceOwnerId;
      },

      isSwitched: (): boolean => {
        const { activeOperator, deviceOwnerId } = get();
        return activeOperator !== null && activeOperator.clerkUserId !== deviceOwnerId;
      },
    }),
    {
      name: 'operator-state',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist critical state — roster is fetched fresh each time
      partialize: (state) => ({
        deviceOwnerId: state.deviceOwnerId,
        activeOperator: state.activeOperator,
        authenticatedAt: state.authenticatedAt,
      }),
    }
  )
);
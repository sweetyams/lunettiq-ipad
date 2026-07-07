import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// MMKV storage adapter for Zustand persist
const storage = new MMKV();
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

interface PrivacyState {
  mode: 'staff' | 'client';
  handedToClient: boolean;
  toggleMode: () => void;
  handToClient: () => void;
  reclaimFromClient: () => void;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      mode: 'staff',
      handedToClient: false,
      
      toggleMode: () => 
        set((state) => ({ 
          mode: state.mode === 'staff' ? 'client' : 'staff' 
        })),
      
      handToClient: () => 
        set({ 
          mode: 'client', 
          handedToClient: true 
        }),
      
      reclaimFromClient: () => 
        set({ 
          mode: 'staff', 
          handedToClient: false 
        }),
    }),
    {
      name: 'privacy-mode',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

interface PrivacyModeProviderProps {
  children: React.ReactNode;
}

export function PrivacyModeProvider({ children }: PrivacyModeProviderProps) {
  // Store is standalone, provider just renders children
  return <>{children}</>;
}
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
  reclaimFromClient: () => Promise<boolean>;
}

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set, get) => ({
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
      
      reclaimFromClient: async () => {
        // Only allow reclaiming if currently handed to client
        if (!get().handedToClient) return true;
        
        // This is a workaround since we can't use hooks in Zustand
        // The actual biometric check should be done by the calling component
        // and then call a separate action to complete the reclaim
        return false;
      },
    }),
    {
      name: 'privacy-mode',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

// Separate action for completing the reclaim after biometric success
export const completeReclaimFromClient = () => {
  usePrivacyStore.setState({ 
    mode: 'staff', 
    handedToClient: false 
  });
};

interface PrivacyModeProviderProps {
  children: React.ReactNode;
}

export function PrivacyModeProvider({ children }: PrivacyModeProviderProps) {
  // Store is standalone, provider just renders children
  return <>{children}</>;
}
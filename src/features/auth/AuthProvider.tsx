import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { QuickSwitchLockScreen } from './QuickSwitchLockScreen';
import { useAutoLock } from './useAutoLock';
import { useBiometric } from './useBiometric';
import { useOperatorStore } from './useOperatorStore';

interface AuthContextType {
  isLocked: boolean;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType>({ isLocked: false, lock: () => {} });

export function useAuthContext(): AuthContextType {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { authenticate } = useBiometric();
  const { locked, unlock: autoUnlock } = useAutoLock();
  const [initialLock, setInitialLock] = useState(true);
  const { setDeviceOwner, clearOperator } = useOperatorStore();

  // Set device owner when Clerk auth loads
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      setDeviceOwner(userId);
    }
  }, [isLoaded, isSignedIn, userId, setDeviceOwner]);

  // On first load, show lock screen (user picks identity via PIN or Face ID)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Keep initial lock — user must authenticate via QuickSwitchLockScreen
      setInitialLock(true);
    } else {
      setInitialLock(false);
    }
  }, [isLoaded, isSignedIn]);

  const isLocked = initialLock || locked;

  const handleUnlock = useCallback(() => {
    setInitialLock(false);
    autoUnlock();
  }, [autoUnlock]);

  const lock = useCallback(() => {
    // Clear operator on manual lock — next unlock requires PIN/Face ID
    clearOperator();
    setInitialLock(true);
  }, [clearOperator]);

  // Don't show lock if not signed in
  if (!isSignedIn) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isLocked, lock }}>
      <View className="flex-1">
        {children}
        {isLocked && <QuickSwitchLockScreen onUnlock={handleUnlock} isAuthReady={isLoaded && isSignedIn} />}
      </View>
    </AuthContext.Provider>
  );
}

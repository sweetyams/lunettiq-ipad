import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { LockScreen } from './LockScreen';
import { useAutoLock } from './useAutoLock';
import { useBiometric } from './useBiometric';

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
  const { isSignedIn, isLoaded } = useAuth();
  const { authenticate } = useBiometric();
  const { locked, unlock: autoUnlock } = useAutoLock();
  const [initialLock, setInitialLock] = useState(true);

  // On first load, require biometric
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Attempt biometric on launch
      authenticate('Unlock Lunettiq').then((success) => {
        if (success) setInitialLock(false);
      });
    } else {
      setInitialLock(false);
    }
  }, [isLoaded, isSignedIn]);

  const isLocked = initialLock || locked;

  const handleUnlock = useCallback(async () => {
    const success = await authenticate('Unlock Lunettiq');
    if (success) {
      setInitialLock(false);
      autoUnlock();
    }
  }, [authenticate, autoUnlock]);

  const lock = useCallback(() => {
    setInitialLock(true);
  }, []);

  // Don't show lock if not signed in
  if (!isSignedIn) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isLocked, lock }}>
      <View className="flex-1">
        {children}
        {isLocked && <LockScreen onUnlock={handleUnlock} />}
      </View>
    </AuthContext.Provider>
  );
}

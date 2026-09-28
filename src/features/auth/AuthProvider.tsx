import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { PinLockScreen } from './PinLockScreen';
import { TouchActivityProvider } from './TouchActivityProvider';
import { useAutoLock } from './useAutoLock';
import { useOperatorStore } from './useOperatorStore';
import { useDeviceSettings } from './useDeviceSettings';
import { useTenantStore } from '@/src/features/tenant/useTenantStore';
import { useTenantCapabilities, useActiveTenantDeviceManagement } from '@/src/features/tenant/useTenantCapabilities';

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
  const { isSignedIn, isLoaded, userId, signOut } = useAuth();
  const { locked, unlock: autoUnlock, resetActivity } = useAutoLock();
  const { pinSystemEnabled } = useDeviceSettings();
  const { setDeviceOwner, clearOperator, switchOperator } = useOperatorStore();

  const activeSlug = useTenantStore((s) => s.activeProject?.slug ?? null);
  const knownProjects = useTenantStore((s) => s.knownProjects);
  const clearActiveProject = useTenantStore((s) => s.clearActiveProject);
  const probeCapability = useTenantCapabilities((s) => s.probe);
  const deviceManagement = useActiveTenantDeviceManagement(); // true | false | null

  // Probe whether the active tenant has the device-management (PIN) module.
  useEffect(() => {
    if (isLoaded && isSignedIn && activeSlug) {
      void probeCapability(activeSlug);
    }
  }, [isLoaded, isSignedIn, activeSlug, probeCapability]);

  // Effective PIN mode: the local setting AND the tenant actually supporting it.
  // If device-management is known-disabled for this tenant, force solo mode (no lock)
  // so the user is never trapped behind a PIN this tenant can't verify.
  const effectivePinEnabled = pinSystemEnabled && deviceManagement !== false;

  // Track whether this is a fresh Clerk sign-in (user just entered credentials)
  // vs an app relaunch with an existing session
  const [initialLock, setInitialLock] = useState<boolean | null>(null); // null = not yet decided
  const wasSignedInRef = useRef(false);

  // Set device owner when Clerk auth loads
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      setDeviceOwner(userId);
    }
  }, [isLoaded, isSignedIn, userId, setDeviceOwner]);

  // Decide whether to show PIN screen on load
  useEffect(() => {
    if (!isLoaded) return;
    if (initialLock !== null) return; // Already decided

    if (!isSignedIn) {
      // Not signed in — no lock needed (login screen handles auth)
      setInitialLock(false);
      return;
    }

    // isSignedIn = true at this point

    if (!wasSignedInRef.current) {
      // Fresh sign-in (transitioned from not-signed-in to signed-in during this session)
      // OR first app launch with existing Clerk session

      if (!effectivePinEnabled) {
        // PIN system off (solo mode, or tenant lacks device-management) — skip lock
        setInitialLock(false);
      } else {
        // PIN system on — show lock screen on app relaunch
        // BUT: if user JUST signed in via Clerk login screen, skip it
        // We detect this via a flag set by the login flow
        setInitialLock(true);
      }
    }

    wasSignedInRef.current = true;
  }, [isLoaded, isSignedIn, effectivePinEnabled, initialLock]);

  // If the tenant turns out NOT to support device-management (probe resolves false)
  // after we already engaged the lock, drop it — this tenant can't verify a PIN.
  useEffect(() => {
    if (deviceManagement === false && initialLock === true) {
      setInitialLock(false);
    }
  }, [deviceManagement, initialLock]);

  /**
   * Called after a successful Clerk sign-in from the login screen.
   * Skips the PIN lock — the device owner just authenticated with full credentials.
   */
  const admitAfterLogin = useCallback(() => {
    setInitialLock(false);
  }, []);

  // Expose admitAfterLogin via context so login screen can call it
  // We attach it to the module level for the login screen to import
  authAdmitRef.current = admitAfterLogin;

  const isLocked = ((initialLock === true) || locked) && deviceManagement !== false;

  const handleUnlock = useCallback(() => {
    setInitialLock(false);
    autoUnlock();
  }, [autoUnlock]);

  const lock = useCallback(() => {
    // Clear operator on manual lock — next unlock requires PIN
    clearOperator();
    setInitialLock(true);
  }, [clearOperator]);

  /** Escape hatch from the lock screen: fully sign out of Clerk. */
  const handleSignOut = useCallback(() => {
    clearOperator();
    void signOut();
  }, [clearOperator, signOut]);

  /**
   * Escape hatch from the lock screen: leave the current tenant so the root gate
   * re-runs discovery (picker for >1 store, or re-select). Available only when the
   * user belongs to more than one store.
   */
  const canChangeStore = knownProjects.length > 1;
  const handleChangeStore = useCallback(() => {
    clearOperator();
    clearActiveProject();
    setInitialLock(false);
  }, [clearOperator, clearActiveProject]);

  // Don't show lock if not signed in or not yet decided
  if (!isSignedIn || initialLock === null) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ isLocked, lock }}>
      <TouchActivityProvider onActivity={resetActivity}>
        {children}
        {isLocked && (
          <PinLockScreen
            onUnlock={handleUnlock}
            isAuthReady={isLoaded && isSignedIn}
            onSignOut={handleSignOut}
            onChangeStore={canChangeStore ? handleChangeStore : undefined}
          />
        )}
      </TouchActivityProvider>
    </AuthContext.Provider>
  );
}

/**
 * Module-level ref for the login screen to call after successful Clerk sign-in.
 * This admits the device owner without showing the PIN screen.
 */
export const authAdmitRef: { current: (() => void) | null } = { current: null };

/**
 * Call this from the login screen after successful Clerk sign-in.
 * Skips the PIN lock — the user just authenticated with full credentials.
 */
export function admitAfterClerkLogin(): void {
  authAdmitRef.current?.();
}

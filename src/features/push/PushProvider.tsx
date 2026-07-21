import { useAuth } from '@clerk/clerk-expo';
import { usePushSetup } from './usePushSetup';

interface PushProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that handles push notification setup and management.
 * Should be placed inside AuthProvider in the component tree.
 * Only runs when user is signed in.
 */
export function PushProvider({ children }: PushProviderProps) {
  const { isSignedIn } = useAuth();
  
  // Setup push notifications - only runs when authenticated
  usePushSetup();

  // This provider doesn't render anything special - it just manages push state
  // The actual notification handling (foreground toasts, etc.) is done in the hook
  return <>{children}</>;
}
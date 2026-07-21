import { useEffect, useRef, useState } from 'react';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useFittingStore } from './useFittingStore';

const HANDED_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const DOUBLE_TAP_TIMEOUT = 500; // ms between taps for double-tap detection

interface HandedModeState {
  isHanded: boolean;
  timedOut: boolean;
}

export function useHandedMode() {
  const { handedToClient, handToClient, reclaimFromClient } = usePrivacyStore();
  const { setVerdict } = useFittingStore();
  const [state, setState] = useState<HandedModeState>({
    isHanded: handedToClient,
    timedOut: false,
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use refs for tap tracking — state causes stale closure in onPress handler
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);

  // Start timeout when handed to client
  useEffect(() => {
    setState(prev => ({ ...prev, isHanded: handedToClient }));
    
    if (handedToClient) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set 10-minute timeout
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, timedOut: true }));
      }, HANDED_TIMEOUT_MS);
    } else {
      // Clear timeout when reclaimed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setState(prev => ({ ...prev, timedOut: false }));
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handedToClient]);

  // Double-tap handler — uses refs to avoid stale closure
  const handleTopEdgePress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (tapCountRef.current === 1 && timeSinceLastTap < DOUBLE_TAP_TIMEOUT) {
      // Second tap within window — trigger exit
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      handleExitGesture();
      return;
    }

    // First tap — start the window
    tapCountRef.current = 1;
    lastTapTimeRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      lastTapTimeRef.current = 0;
      tapTimeoutRef.current = null;
    }, DOUBLE_TAP_TIMEOUT);
  };

  const handleExitGesture = async () => {
    // This would trigger biometric authentication in real implementation
    // For now, we'll simulate it
    try {
      // TODO: Integrate with expo-local-authentication
      // const { success } = await LocalAuthentication.authenticateAsync({
      //   promptMessage: 'Staff authentication required',
      //   fallbackLabel: 'Use passcode',
      // });
      
      // Simulate successful biometric auth for now
      const success = true;
      
      if (success) {
        reclaimFromClient();
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    }
  };

  const handleHandToClient = () => {
    handToClient();
  };

  const handleReclaim = () => {
    reclaimFromClient();
  };

  // Client verdict handler - marks verdicts as client-set
  const handleClientVerdict = (photoId: string, verdict: 'loved' | 'liked' | 'unsure' | 'rejected') => {
    // Set verdict with client marker - we'll extend the fitting store to track this
    setVerdict(photoId, verdict);
    
    // TODO: In a full implementation, we'd track that this verdict was client-set
    // This could be done by extending SessionPhoto to include `verdictSetBy: 'staff' | 'client'`
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return {
    isHanded: state.isHanded,
    timedOut: state.timedOut,
    exitGesture: handleTopEdgePress, // Now a simple onPress handler
    handToClient: handleHandToClient,
    reclaim: handleReclaim,
    handleClientVerdict,
  };
}
import { useEffect, useRef, useState } from 'react';
import { usePrivacyStore } from '@/src/features/privacy/PrivacyModeProvider';
import { useFittingStore } from './useFittingStore';

const HANDED_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const DOUBLE_TAP_TIMEOUT = 300; // ms between taps for double-tap detection

interface HandedModeState {
  isHanded: boolean;
  timedOut: boolean;
  lastTapTime: number;
  tapCount: number;
}

export function useHandedMode() {
  const { handedToClient, handToClient, reclaimFromClient } = usePrivacyStore();
  const { setVerdict } = useFittingStore();
  const [state, setState] = useState<HandedModeState>({
    isHanded: handedToClient,
    timedOut: false,
    lastTapTime: 0,
    tapCount: 0,
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Double-tap handler for top edge (called from Pressable onPress)
  const handleTopEdgePress = () => {
    const now = Date.now();
    const timeSinceLastTap = now - state.lastTapTime;
    
    if (timeSinceLastTap < DOUBLE_TAP_TIMEOUT && state.tapCount === 1) {
      // This is the second tap - trigger exit
      handleExitGesture();
      setState(prev => ({ ...prev, tapCount: 0, lastTapTime: 0 }));
      return;
    }
    
    // First tap or timeout exceeded - start counting
    setState(prev => ({ ...prev, tapCount: 1, lastTapTime: now }));
    
    // Clear tap count after timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, tapCount: 0, lastTapTime: 0 }));
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
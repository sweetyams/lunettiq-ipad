import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { useFittingStore } from '@/src/features/fitting/useFittingStore';
import { usePrivacyStore, completeReclaimFromClient } from '@/src/features/privacy/PrivacyModeProvider';

describe('Session lifecycle integration', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
    useFittingStore.getState().reset();
    usePrivacyStore.setState({ mode: 'staff', handedToClient: false });
  });

  it('full session flow: idle → session → fitting → session → idle', () => {
    // Start session
    useSessionStore.getState().startSession('c1', 'Marie D.');
    expect(useSessionStore.getState().mode).toBe('session');

    // Start fitting
    useSessionStore.getState().startFitting();
    useFittingStore.getState().startFitting();
    expect(useSessionStore.getState().mode).toBe('fitting');
    expect(useFittingStore.getState().isActive).toBe(true);

    // End fitting
    useSessionStore.getState().endFitting();
    useFittingStore.getState().endFitting();
    expect(useSessionStore.getState().mode).toBe('session');

    // End session
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().mode).toBe('idle');
    expect(useSessionStore.getState().activeClientId).toBeNull();
  });

  it('privacy mode affects session state independently', () => {
    useSessionStore.getState().startSession('c1', 'Marie D.');
    usePrivacyStore.getState().toggleMode();
    expect(usePrivacyStore.getState().mode).toBe('client');
    expect(useSessionStore.getState().mode).toBe('session'); // unchanged
  });

  it('hand-to-client during fitting is valid', () => {
    useSessionStore.getState().startSession('c1', 'Marie');
    useSessionStore.getState().startFitting();
    usePrivacyStore.getState().handToClient();
    expect(useSessionStore.getState().mode).toBe('fitting');
    expect(usePrivacyStore.getState().handedToClient).toBe(true);
    expect(usePrivacyStore.getState().mode).toBe('client');
  });

  it('reclaim from client restores staff mode', () => {
    usePrivacyStore.getState().handToClient();
    completeReclaimFromClient();
    expect(usePrivacyStore.getState().mode).toBe('staff');
    expect(usePrivacyStore.getState().handedToClient).toBe(false);
  });

  it('fitting photos persist across mode transitions', () => {
    useSessionStore.getState().startSession('c1', 'Marie');
    useFittingStore.getState().startFitting();
    useFittingStore.getState().addPhoto({
      id: 'p1', localUri: 'file://p1', thumbnailUri: 'file://t1',
      r2Key: null, productId: null, productName: null,
      verdict: null, notes: '', clientVisible: true,
      capturedAt: Date.now(), uploadStatus: 'pending',
      isShortlisted: false,
    });
    
    // Toggle privacy — photos should remain
    usePrivacyStore.getState().toggleMode();
    expect(useFittingStore.getState().photos).toHaveLength(1);
    
    // End fitting — photos should remain in store
    useFittingStore.getState().endFitting();
    expect(useFittingStore.getState().photos).toHaveLength(1);
  });
});

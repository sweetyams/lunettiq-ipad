import { describe, it, expect, beforeEach } from 'vitest';
import { usePrivacyStore, completeReclaimFromClient } from '@/src/features/privacy/PrivacyModeProvider';

describe('usePrivacyStore', () => {
  beforeEach(() => {
    usePrivacyStore.setState({ mode: 'staff', handedToClient: false });
  });

  it('defaults to staff mode', () => {
    expect(usePrivacyStore.getState().mode).toBe('staff');
    expect(usePrivacyStore.getState().handedToClient).toBe(false);
  });

  it('toggleMode switches staff to client', () => {
    usePrivacyStore.getState().toggleMode();
    expect(usePrivacyStore.getState().mode).toBe('client');
  });

  it('toggleMode switches client back to staff', () => {
    usePrivacyStore.getState().toggleMode();
    usePrivacyStore.getState().toggleMode();
    expect(usePrivacyStore.getState().mode).toBe('staff');
  });

  it('handToClient sets mode=client and handedToClient=true', () => {
    usePrivacyStore.getState().handToClient();
    const state = usePrivacyStore.getState();
    expect(state.mode).toBe('client');
    expect(state.handedToClient).toBe(true);
  });

  it('completeReclaimFromClient resets to staff mode', () => {
    usePrivacyStore.getState().handToClient();
    completeReclaimFromClient();
    const state = usePrivacyStore.getState();
    expect(state.mode).toBe('staff');
    expect(state.handedToClient).toBe(false);
  });
});

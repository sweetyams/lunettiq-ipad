import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/src/features/session/useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('starts in idle mode with no client', () => {
    const state = useSessionStore.getState();
    expect(state.mode).toBe('idle');
    expect(state.activeClientId).toBeNull();
    expect(state.sessionId).toBeNull();
  });

  it('startSession sets mode, clientId, and generates sessionId', () => {
    useSessionStore.getState().startSession('client-1', 'Marie D.');
    const state = useSessionStore.getState();
    expect(state.mode).toBe('session');
    expect(state.activeClientId).toBe('client-1');
    expect(state.activeClientName).toBe('Marie D.');
    expect(state.sessionId).toMatch(/^ses_/);
    expect(state.sessionStartedAt).toBeGreaterThan(0);
  });

  it('startFitting only works from session mode', () => {
    // From idle — should not transition
    useSessionStore.getState().startFitting();
    expect(useSessionStore.getState().mode).toBe('idle');

    // From session — should transition
    useSessionStore.getState().startSession('c1', 'Test');
    useSessionStore.getState().startFitting();
    expect(useSessionStore.getState().mode).toBe('fitting');
  });

  it('endFitting returns to session mode', () => {
    useSessionStore.getState().startSession('c1', 'Test');
    useSessionStore.getState().startFitting();
    useSessionStore.getState().endFitting();
    expect(useSessionStore.getState().mode).toBe('session');
    expect(useSessionStore.getState().activeClientId).toBe('c1');
  });

  it('endSession resets all state', () => {
    useSessionStore.getState().startSession('c1', 'Test');
    useSessionStore.getState().addFrameTried({ id: 'f1', productId: 'p1', productName: 'Frame A', photoIds: [], triedAt: Date.now() });
    useSessionStore.getState().endSession();
    const state = useSessionStore.getState();
    expect(state.mode).toBe('idle');
    expect(state.activeClientId).toBeNull();
    expect(state.framesTried).toHaveLength(0);
  });

  it('addFrameTried appends to array', () => {
    useSessionStore.getState().startSession('c1', 'Test');
    useSessionStore.getState().addFrameTried({ id: 'f1', productId: 'p1', productName: 'Frame A', photoIds: [], triedAt: Date.now() });
    useSessionStore.getState().addFrameTried({ id: 'f2', productId: 'p2', productName: 'Frame B', photoIds: [], triedAt: Date.now() });
    expect(useSessionStore.getState().framesTried).toHaveLength(2);
  });

  it('updateFrameVerdict updates the correct frame', () => {
    useSessionStore.getState().startSession('c1', 'Test');
    useSessionStore.getState().addFrameTried({ id: 'f1', productId: 'p1', productName: 'A', photoIds: [], triedAt: Date.now() });
    useSessionStore.getState().addFrameTried({ id: 'f2', productId: 'p2', productName: 'B', photoIds: [], triedAt: Date.now() });
    useSessionStore.getState().updateFrameVerdict('f2', 'loved');
    const frames = useSessionStore.getState().framesTried;
    expect(frames[0].verdict).toBeUndefined();
    expect(frames[1].verdict).toBe('loved');
  });
});

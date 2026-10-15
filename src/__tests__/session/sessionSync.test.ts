import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore, type FrameTried } from '@/src/features/session/useSessionStore';
import {
  isLocalSessionId,
  toServerFramesTried,
  unsyncedFrames,
  verdictToInteractionType,
} from '@/src/features/session/sessionSync';

const frame = (overrides: Partial<FrameTried> = {}): FrameTried => ({
  id: 'f1',
  productId: 'prod-1',
  productName: 'Persol PO3007',
  notes: '',
  photoIds: [],
  triedAt: 1_000,
  ...overrides,
});

describe('sessionSync helpers', () => {
  it('treats ses_ placeholders and empty ids as local', () => {
    expect(isLocalSessionId('ses_abc_123')).toBe(true);
    expect(isLocalSessionId(null)).toBe(true);
    expect(isLocalSessionId('6f1c2a7e-0000-4000-8000-000000000000')).toBe(false);
  });

  it('maps verdicts to the interaction types Foundry reads', () => {
    expect(verdictToInteractionType('loved')).toBe('liked');
    expect(verdictToInteractionType('liked')).toBe('liked');
    expect(verdictToInteractionType('rejected')).toBe('disliked');
    expect(verdictToInteractionType('unsure')).toBeNull();
    expect(verdictToInteractionType(undefined)).toBeNull();
  });

  it('shapes frames for the server session', () => {
    expect(
      toServerFramesTried([
        frame({ verdict: 'loved', variantId: 'v-9', notes: 'Great fit' }),
        frame({ id: 'f2', productId: 'prod-2' }),
      ]),
    ).toEqual([
      { productId: 'prod-1', variantId: 'v-9', verdict: 'loved', notes: 'Great fit', photoKeys: [] },
      { productId: 'prod-2', verdict: null, notes: '', photoKeys: [] },
    ]);
  });

  it('lists only frames whose try-on has not been sent', () => {
    const frames = [frame(), frame({ id: 'f2', syncedAt: 2_000 })];
    expect(unsyncedFrames(frames).map((f) => f.id)).toEqual(['f1']);
  });
});

describe('useSessionStore server sync actions', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('links the visit to its appointment', () => {
    useSessionStore.getState().startSession('c1', 'Marie Dubois', { appointmentId: 'appt-7' });
    expect(useSessionStore.getState().appointmentId).toBe('appt-7');
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().appointmentId).toBeNull();
  });

  it('swaps in the server id only for the session that is still active', () => {
    useSessionStore.getState().startSession('c1', 'Marie Dubois');
    const localId = useSessionStore.getState().sessionId as string;

    useSessionStore.getState().replaceLocalSessionId('ses_stale_000', 'server-old');
    expect(useSessionStore.getState().sessionId).toBe(localId);

    useSessionStore.getState().replaceLocalSessionId(localId, 'server-1');
    expect(useSessionStore.getState().sessionId).toBe('server-1');
  });

  it('marks a frame as synced', () => {
    useSessionStore.getState().startSession('c1', 'Marie Dubois');
    useSessionStore.getState().addFrameTried(frame());
    useSessionStore.getState().markFrameSynced('f1');
    expect(useSessionStore.getState().framesTried[0]?.syncedAt).toBeGreaterThan(0);
  });
});

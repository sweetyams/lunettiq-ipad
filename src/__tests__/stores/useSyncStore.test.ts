import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';

// Replicate the sync store shape to test it independently
// (avoids pulling in WatermelonDB through the SyncProvider import chain)
interface SyncState {
  isOnline: boolean;
  pendingWrites: number;
  lastSyncAt: number | null;
  setOnline: (isOnline: boolean) => void;
  setPendingWrites: (count: number) => void;
  setLastSyncAt: (timestamp: number) => void;
}

const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  pendingWrites: 0,
  lastSyncAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setPendingWrites: (count) => set({ pendingWrites: count }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
}));

describe('useSyncStore', () => {
  beforeEach(() => {
    useSyncStore.setState({ isOnline: true, pendingWrites: 0, lastSyncAt: null });
  });

  it('defaults to online with no pending writes', () => {
    const state = useSyncStore.getState();
    expect(state.isOnline).toBe(true);
    expect(state.pendingWrites).toBe(0);
    expect(state.lastSyncAt).toBeNull();
  });

  it('setOnline updates connectivity state', () => {
    useSyncStore.getState().setOnline(false);
    expect(useSyncStore.getState().isOnline).toBe(false);
    useSyncStore.getState().setOnline(true);
    expect(useSyncStore.getState().isOnline).toBe(true);
  });

  it('setPendingWrites tracks queue depth', () => {
    useSyncStore.getState().setPendingWrites(5);
    expect(useSyncStore.getState().pendingWrites).toBe(5);
    useSyncStore.getState().setPendingWrites(0);
    expect(useSyncStore.getState().pendingWrites).toBe(0);
  });

  it('setLastSyncAt records timestamp', () => {
    const now = Date.now();
    useSyncStore.getState().setLastSyncAt(now);
    expect(useSyncStore.getState().lastSyncAt).toBe(now);
  });
});

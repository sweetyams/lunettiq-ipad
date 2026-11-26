/**
 * Visit close outbox — persisted store + background worker (pure steps in visitOutbox.ts).
 *
 * End visit saves the whole close here first, so a visit ended offline (or when Foundry
 * hiccups) is never lost: the worker finishes it when the iPad is back online, resuming
 * at the step that failed. Mounted once next to SessionServerBridge.
 */
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { dueCloses, runClose, type OutboxDeps, type PendingClose } from './visitOutbox';

const storage = new MMKV({ id: 'visit-outbox' });

interface OutboxState {
  closes: PendingClose[];
  add: (job: PendingClose) => void;
  save: (job: PendingClose) => void;
}

export const useVisitOutbox = create<OutboxState>()(
  persist(
    (set) => ({
      closes: [],
      add: (job) => set((s) => ({ closes: [...s.closes, job] })),
      // Finished jobs leave the outbox; anything else is updated in place.
      save: (job) => set((s) => ({
        closes: job.step === 'done' ? s.closes.filter((j) => j.id !== job.id) : s.closes.map((j) => (j.id === job.id ? job : j)),
      })),
    }),
    {
      name: 'visit-outbox',
      storage: createJSONStorage(() => ({
        getItem: (n) => storage.getString(n) ?? null,
        setItem: (n, v) => storage.set(n, v),
        removeItem: (n) => storage.delete(n),
      })),
    },
  ),
);

export const usePendingVisitCount = () => useVisitOutbox((s) => s.closes.length);

/** Foundry calls for each step (same endpoints and fields as the online path). */
export const outboxDeps: OutboxDeps = {
  createSession: ({ clientId, locationId, appointmentId }) =>
    api.post<{ id: string }>(`/api/clients/${clientId}/tryon-sessions`, {
      ...(locationId ? { locationId } : {}),
      ...(appointmentId ? { appointmentId } : {}),
      mode: 'session',
    }),
  postInteraction: (clientId, body) =>
    api.post(`/api/clients/${clientId}/product-interactions`, { ...body, surface: 'tablet', source: 'tablet' }),
  patchFrames: (clientId, sessionId, framesTried) =>
    api.patch(`/api/clients/${clientId}/tryon-sessions/${sessionId}`, { framesTried }),
  endSession: (clientId, sessionId, body) =>
    api.post(`/api/clients/${clientId}/tryon-sessions/${sessionId}/end`, body),
};

/** Closes being sent right now, by job id: End visit and the worker share one run, never two. */
const inFlight = new Map<string, Promise<PendingClose>>();

/**
 * Run one close now (End visit calls this right after saving it). Adding the job also
 * wakes the worker; both used to send the same job, doubling tried-on and verdict
 * interactions and calling /end twice.
 */
export function flushClose(job: PendingClose): Promise<PendingClose> {
  const running = inFlight.get(job.id);
  if (running) return running;
  const { save } = useVisitOutbox.getState();
  const run = runClose(job, outboxDeps, save).finally(() => inFlight.delete(job.id));
  inFlight.set(job.id, run);
  return run;
}

const TICK_MS = 15_000;

export function VisitOutboxWorker() {
  const isOnline = useSyncStore((s) => s.isOnline);
  const count = usePendingVisitCount();
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!isOnline || count === 0) return;
    const drain = async () => {
      if (running.current) return;
      running.current = true;
      try {
        for (const job of dueCloses(useVisitOutbox.getState().closes)) {
          const result = await flushClose(job);
          if (result.step === 'done') {
            queryClient.invalidateQueries({ queryKey: ['clients', job.clientId] });
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
          }
        }
      } finally {
        running.current = false;
      }
    };
    void drain();
    const t = setInterval(drain, TICK_MS);
    return () => clearInterval(t);
  }, [isOnline, count, queryClient]);

  return null;
}

/**
 * SessionServerBridge — keeps the active visit in step with Foundry.
 *
 * Sessions start instantly on the device with a local `ses_` id so the floor
 * never waits on the network. This bridge then:
 *  1. creates the try-on session on Foundry and swaps in the server id;
 *  2. sends a `tried_on` product interaction for every frame as it is added,
 *     which is what feeds the hot-leads (Smart Discounts) pipeline.
 *
 * Both steps retry with backoff while offline or on failure. Mounted once in
 * the app layout; renders nothing.
 */
import { useEffect, useRef, useState } from 'react';
import { useCreateSession } from '@/src/api/useSessions';
import { useCreateProductInteraction } from '@/src/api/useProductInteractions';
import { useSyncStore } from '@/src/sync/useSyncStore';
import { useEffectiveLocationId } from '@/src/features/tenant/useDeviceLocationStore';
import { useSessionStore } from './useSessionStore';
import { isLocalSessionId, unsyncedFrames } from './sessionSync';

const MIN_RETRY_MS = 15_000;
const MAX_RETRY_MS = 5 * 60_000;

export function SessionServerBridge() {
  const mode = useSessionStore((s) => s.mode);
  const clientId = useSessionStore((s) => s.activeClientId);
  const sessionId = useSessionStore((s) => s.sessionId);
  const appointmentId = useSessionStore((s) => s.appointmentId);
  const framesTried = useSessionStore((s) => s.framesTried);
  const replaceLocalSessionId = useSessionStore((s) => s.replaceLocalSessionId);
  const markFrameSynced = useSessionStore((s) => s.markFrameSynced);

  const isOnline = useSyncStore((s) => s.isOnline);
  const locationId = useEffectiveLocationId();

  const createSession = useCreateSession();
  const logInteraction = useCreateProductInteraction();

  const [retryTick, setRetryTick] = useState(0);
  const creatingFor = useRef<string | null>(null);
  const framesInFlight = useRef(new Set<string>());
  const failures = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = mode !== 'idle' && !!clientId && !!sessionId;

  const scheduleRetry = () => {
    if (retryTimer.current) return;
    failures.current += 1;
    const delay = Math.min(MIN_RETRY_MS * 2 ** (failures.current - 1), MAX_RETRY_MS);
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      setRetryTick((t) => t + 1);
    }, delay);
  };

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  // A new visit starts with a clean retry budget.
  useEffect(() => {
    failures.current = 0;
    framesInFlight.current.clear();
  }, [clientId]);

  // 1. Create the server session for a visit that only exists locally.
  useEffect(() => {
    if (!isActive || !isOnline || !isLocalSessionId(sessionId)) return;
    if (creatingFor.current === sessionId) return;

    const localId = sessionId as string;
    creatingFor.current = localId;
    createSession
      .mutateAsync({ clientId: clientId as string, locationId, appointmentId })
      .then((session) => {
        failures.current = 0;
        replaceLocalSessionId(localId, session.id);
      })
      .catch((error) => {
        if (__DEV__) console.warn('[SessionServerBridge] create session failed, will retry', error);
        creatingFor.current = null;
        scheduleRetry();
      });
    // createSession / replaceLocalSessionId are stable; retryTick re-runs after backoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isOnline, sessionId, clientId, locationId, appointmentId, retryTick]);

  // 2. Send a `tried_on` interaction for every frame not yet on the server.
  useEffect(() => {
    if (!isActive || !isOnline || isLocalSessionId(sessionId)) return;

    for (const frame of unsyncedFrames(framesTried)) {
      if (framesInFlight.current.has(frame.id)) continue;
      framesInFlight.current.add(frame.id);
      logInteraction
        .mutateAsync({
          clientId: clientId as string,
          productId: frame.productId,
          variantId: frame.variantId,
          type: 'tried_on',
          sessionId,
          locationId,
          metadata: { triedAt: frame.triedAt },
        })
        .then(() => markFrameSynced(frame.id))
        .catch((error) => {
          if (__DEV__) console.warn('[SessionServerBridge] tried_on failed, will retry', error);
          scheduleRetry();
        })
        .finally(() => framesInFlight.current.delete(frame.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isOnline, sessionId, clientId, locationId, framesTried, retryTick]);

  return null;
}

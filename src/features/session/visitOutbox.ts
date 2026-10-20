/**
 * Visit close outbox — pure core.
 *
 * Ending a visit is several Foundry calls that depend on each other:
 *   1. create the try-on session if it only exists on the iPad (local `ses_` id);
 *   2. `tried_on` interactions for frames the bridge hadn't sent;
 *   3. PATCH framesTried (verdicts) on the session;
 *   4. POST …/end with the outcome;
 *   5. `liked` / `disliked` interactions per verdict.
 * The whole close is saved first (VisitOutbox store) and run one step at a time,
 * recording progress after each, so a dropped connection resumes where it stopped
 * and nothing is sent twice. No React or network imports here: deps are injected.
 */
import { isLocalSessionId, type ServerFrameTried } from './sessionSync';

export interface OutboxInteraction {
  productId: string;
  variantId?: string;
  type: 'tried_on' | 'liked' | 'disliked';
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface EndPayload {
  outcome: 'purchased' | 'saved_for_later' | 'no_match' | 'needs_followup';
  notes?: string;
  sendSummary?: boolean;
  summaryLanguage?: 'en' | 'fr';
  tags?: string[];
  orderRef?: string;
}

export type CloseStep = 'session' | 'triedOn' | 'frames' | 'end' | 'verdicts' | 'done';

export interface PendingClose {
  id: string;
  createdAt: number;
  clientId: string;
  clientName?: string;
  /** Local `ses_` id until step 1 swaps in the server id. */
  sessionId: string;
  locationId?: string | null;
  appointmentId?: string | null;
  framesTried: ServerFrameTried[];
  /** Remaining `tried_on` interactions (removed as each one is accepted). */
  triedOn: OutboxInteraction[];
  /** Remaining verdict interactions. */
  verdicts: OutboxInteraction[];
  end: EndPayload;
  step: CloseStep;
  attempts: number;
  lastError?: string;
  nextAttemptAt?: number;
}

export interface OutboxDeps {
  createSession: (p: { clientId: string; locationId?: string | null; appointmentId?: string | null }) => Promise<{ id: string }>;
  postInteraction: (clientId: string, body: OutboxInteraction & { sessionId: string; locationId?: string | null }) => Promise<unknown>;
  patchFrames: (clientId: string, sessionId: string, framesTried: ServerFrameTried[]) => Promise<unknown>;
  endSession: (clientId: string, sessionId: string, body: EndPayload) => Promise<unknown>;
}

export function newClose(input: Omit<PendingClose, 'id' | 'createdAt' | 'step' | 'attempts'>, now = Date.now()): PendingClose {
  return {
    ...input,
    id: `close_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    step: isLocalSessionId(input.sessionId) ? 'session' : input.triedOn.length ? 'triedOn' : 'frames',
    attempts: 0,
  };
}

/**
 * Run one step. Returns the updated job (immutably). Throws are caught by the caller,
 * which records the error and backs off; the job is unchanged for that step.
 */
export async function runStep(job: PendingClose, deps: OutboxDeps): Promise<PendingClose> {
  switch (job.step) {
    case 'session': {
      if (!isLocalSessionId(job.sessionId)) return { ...job, step: 'triedOn' };
      const s = await deps.createSession({ clientId: job.clientId, locationId: job.locationId, appointmentId: job.appointmentId });
      return { ...job, sessionId: s.id, step: 'triedOn' };
    }
    case 'triedOn': {
      const [next, ...rest] = job.triedOn;
      if (!next) return { ...job, step: 'frames' };
      await deps.postInteraction(job.clientId, { ...next, sessionId: job.sessionId, locationId: job.locationId });
      return { ...job, triedOn: rest, step: rest.length ? 'triedOn' : 'frames' };
    }
    case 'frames': {
      if (job.framesTried.length) await deps.patchFrames(job.clientId, job.sessionId, job.framesTried);
      return { ...job, step: 'end' };
    }
    case 'end': {
      await deps.endSession(job.clientId, job.sessionId, job.end);
      return { ...job, step: job.verdicts.length ? 'verdicts' : 'done' };
    }
    case 'verdicts': {
      const [next, ...rest] = job.verdicts;
      if (!next) return { ...job, step: 'done' };
      await deps.postInteraction(job.clientId, { ...next, sessionId: job.sessionId, locationId: job.locationId });
      return { ...job, verdicts: rest, step: rest.length ? 'verdicts' : 'done' };
    }
    default:
      return job;
  }
}

/** Run steps until done or a step fails. `onProgress` persists after every step. */
export async function runClose(
  job: PendingClose,
  deps: OutboxDeps,
  onProgress: (j: PendingClose) => void,
  now: () => number = Date.now,
): Promise<PendingClose> {
  let current = job;
  while (current.step !== 'done') {
    try {
      current = await runStep(current, deps);
      current = { ...current, attempts: 0, lastError: undefined, nextAttemptAt: undefined };
      onProgress(current);
    } catch (e) {
      const attempts = current.attempts + 1;
      current = {
        ...current,
        attempts,
        lastError: e instanceof Error ? e.message : String(e),
        nextAttemptAt: now() + backoffMs(attempts),
      };
      onProgress(current);
      return current;
    }
  }
  return current;
}

/** 15 s, 30 s, 1 min … capped at 10 min. */
export function backoffMs(attempts: number): number {
  return Math.min(15_000 * 2 ** Math.max(0, attempts - 1), 10 * 60_000);
}

/** Jobs ready to run now, oldest first. */
export function dueCloses(jobs: PendingClose[], now = Date.now()): PendingClose[] {
  return jobs
    .filter((j) => j.step !== 'done' && (!j.nextAttemptAt || j.nextAttemptAt <= now))
    .sort((a, b) => a.createdAt - b.createdAt);
}

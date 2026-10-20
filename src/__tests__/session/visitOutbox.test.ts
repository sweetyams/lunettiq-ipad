import { describe, it, expect, vi } from 'vitest';
import { newClose, runClose, runStep, dueCloses, backoffMs, type OutboxDeps, type PendingClose } from '@/src/features/session/visitOutbox';

const base = {
  clientId: 'c1',
  sessionId: 'ses_local1',
  locationId: 'L1',
  appointmentId: 'a1',
  framesTried: [{ productId: 'p1', verdict: 'loved' as const, notes: '', photoKeys: [] }],
  triedOn: [{ productId: 'p1', type: 'tried_on' as const }, { productId: 'p2', type: 'tried_on' as const }],
  verdicts: [{ productId: 'p1', type: 'liked' as const }],
  end: { outcome: 'no_match' as const, tags: ['vip'] },
};

function deps(over: Partial<OutboxDeps> = {}) {
  const calls: string[] = [];
  const d: OutboxDeps = {
    createSession: vi.fn(async () => { calls.push('create'); return { id: 'srv-1' }; }),
    postInteraction: vi.fn(async (_c, b) => { calls.push(`${b.type}:${b.productId}@${b.sessionId}`); }),
    patchFrames: vi.fn(async (_c, s) => { calls.push(`frames@${s}`); }),
    endSession: vi.fn(async (_c, s) => { calls.push(`end@${s}`); }),
    ...over,
  };
  return { d, calls };
}

describe('visit close outbox', () => {
  it('runs every step in order, using the server id once it exists', async () => {
    const { d, calls } = deps();
    const progress: PendingClose[] = [];
    const done = await runClose(newClose(base, 1000), d, (j) => progress.push(j));
    expect(done.step).toBe('done');
    expect(calls).toEqual(['create', 'tried_on:p1@srv-1', 'tried_on:p2@srv-1', 'frames@srv-1', 'end@srv-1', 'liked:p1@srv-1']);
    expect(progress.length).toBe(calls.length);
  });

  it('skips session creation for a visit already on the server', () => {
    expect(newClose({ ...base, sessionId: 'srv-9' }).step).toBe('triedOn');
    expect(newClose({ ...base, sessionId: 'srv-9', triedOn: [] }).step).toBe('frames');
  });

  it('stops at a failing step, records backoff, and resumes without repeating sent work', async () => {
    let failEnd = true;
    const { d, calls } = deps({ endSession: vi.fn(async () => { if (failEnd) throw new Error('Network request failed'); calls.push('end'); }) });
    const saved: PendingClose[] = [];
    const first = await runClose(newClose(base, 1000), d, (j) => saved.push(j), () => 5000);
    expect(first.step).toBe('end');
    expect(first.attempts).toBe(1);
    expect(first.lastError).toBe('Network request failed');
    expect(first.nextAttemptAt).toBe(5000 + 15_000);
    expect(first.triedOn).toEqual([]);
    expect(dueCloses([first], 6000)).toEqual([]);
    expect(dueCloses([first], 20_000)).toHaveLength(1);

    failEnd = false;
    const callsBefore = [...calls];
    const second = await runClose(first, d, () => {});
    expect(second.step).toBe('done');
    expect(calls.slice(callsBefore.length)).toEqual(['end', 'liked:p1@srv-1']);
    expect((d.createSession as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('a step that fails leaves the job as it was for that step', async () => {
    const { d } = deps({ postInteraction: vi.fn(async () => { throw new Error('500'); }) });
    const job = { ...newClose({ ...base, sessionId: 'srv-1' }), step: 'triedOn' as const };
    await expect(runStep(job, d)).rejects.toThrow('500');
    expect(job.triedOn).toHaveLength(2);
  });

  it('backoff doubles and caps at 10 minutes', () => {
    expect([1, 2, 3].map(backoffMs)).toEqual([15_000, 30_000, 60_000]);
    expect(backoffMs(20)).toBe(600_000);
  });
});

import { describe, it, expect } from 'vitest';
import { toApprovalSummary, toRxPipelineCounts } from '@/src/api/rxMapping';

describe('rxMapping', () => {
  it('groups Foundry pipeline states into the iPad counts', () => {
    const counts = toRxPipelineCounts({
      awaiting_rx: { count: 5, totalCents: 1, depositCents: 1 },
      rx_submitted: { count: 1 },
      optician_review: { count: 3 },
      ready_for_lab: { count: 1 },
      at_lab: { count: 1 },
      received_from_lab: { count: 1 },
      ready_for_pickup: { count: 3 },
      ready_to_ship: { count: 1 },
      picked_up: { count: 4 },
      fulfilled: { count: 2 },
    });
    expect(counts).toEqual({ awaiting_rx: 5, ordered: 5, in_lab: 1, quality_check: 1, ready: 4, total: 16 });
  });

  it('accepts the legacy iPad shape and empty responses', () => {
    expect(toRxPipelineCounts({ awaiting_rx: 1, ordered: 2, in_lab: 0, quality_check: 0, ready: 3, total: 6 }).total).toBe(6);
    expect(toRxPipelineCounts(null).total).toBe(0);
  });

  it('maps the remote-approval summary', () => {
    expect(toApprovalSummary({ pending: 2, inReview: 2, todaySignOffs: 1, avgReviewSeconds: 180 })).toEqual({
      submitted: 2, in_review: 2, approved: 1, rejected: 0, returned: 0, total: 4,
    });
  });
});

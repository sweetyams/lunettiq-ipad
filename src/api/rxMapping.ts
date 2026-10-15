/**
 * Maps Foundry's Rx pipeline and approval summaries to the shapes the iPad screens use.
 *
 * Foundry's rx-operations module has 12 order states and returns counts as
 * `{ [state]: { count, totalCents, depositCents } }`. The iPad still groups orders
 * the older way (awaiting Rx / ordered / in lab / QC / ready). The remote-approval
 * summary returns `{ pending, inReview, todaySignOffs, ... }`.
 */
import type { RxPipelineCounts } from './rx-pipeline.types';
import type { ApprovalSummary } from './rx-approvals.types';

type FoundryStateCount = { count?: number | string } | number | undefined;

/** Foundry state → the iPad's display group. Picked up / delivered / fulfilled are done. */
const STATE_GROUP: Record<string, keyof Omit<RxPipelineCounts, 'total'> | null> = {
  awaiting_rx: 'awaiting_rx',
  rx_submitted: 'ordered',
  optician_review: 'ordered',
  ready_for_lab: 'ordered',
  at_lab: 'in_lab',
  received_from_lab: 'quality_check',
  ready_for_pickup: 'ready',
  ready_to_ship: 'ready',
  shipped: null,
  delivered: null,
  picked_up: null,
  fulfilled: null,
};

function countOf(v: FoundryStateCount): number {
  if (typeof v === 'number') return v;
  return Number(v?.count ?? 0) || 0;
}

export function toRxPipelineCounts(raw: unknown): RxPipelineCounts {
  const out: RxPipelineCounts = { awaiting_rx: 0, ordered: 0, in_lab: 0, quality_check: 0, ready: 0, total: 0 };
  if (!raw || typeof raw !== 'object') return out;
  const legacyGroups = new Set<string>(['awaiting_rx', 'ordered', 'in_lab', 'quality_check', 'ready']);
  for (const [state, value] of Object.entries(raw as Record<string, FoundryStateCount>)) {
    // Foundry state names map to a group; plain-number legacy group keys are kept as-is.
    const group = STATE_GROUP[state] ?? (typeof value === 'number' && legacyGroups.has(state) ? state as keyof Omit<RxPipelineCounts, 'total'> : null);
    if (group) out[group] += countOf(value);
  }
  out.total = out.awaiting_rx + out.ordered + out.in_lab + out.quality_check + out.ready;
  return out;
}

export function toApprovalSummary(raw: unknown): ApprovalSummary {
  const r = (raw ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => Number(v ?? 0) || 0;
  const submitted = n(r.submitted ?? r.pending);
  const inReview = n(r.in_review ?? r.inReview);
  return {
    submitted,
    in_review: inReview,
    approved: n(r.approved ?? r.todaySignOffs),
    rejected: n(r.rejected),
    returned: n(r.returned),
    total: n(r.total) || submitted + inReview,
  };
}

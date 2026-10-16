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

// --- Remote approval inbox ---

export interface FoundryApprovalRow {
  id: string;
  orderId: string;
  clientId: string;
  status: string;
  priority?: string | null;
  submittedAt?: string | null;
  claimedBy?: string | null;
  flagsOpen?: number | null;
  locationId?: string | null;
  snapshot?: {
    clientName?: string;
    frame?: string;
    lens?: string;
    product?: { name?: string };
    lensType?: string;
    measurements?: { pd?: number };
    flags?: Array<{ type?: string; message?: string }>;
  } | null;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  status: string;
  priority: 'normal' | 'high';
  claimedBy: string | null;
  /** "Marais © Crimson · progressive 1.67" */
  description: string;
  pd: number | null;
  /** First open anomaly, e.g. "PD difference: measured 58 mm vs 64 mm" */
  anomaly: string | null;
  minutesWaiting: number;
}

export function toReviewItem(row: FoundryApprovalRow, names: ReadonlyMap<string, string> = new Map(), now = Date.now()): ReviewItem {
  const snap = row.snapshot ?? {};
  const frame = snap.frame ?? snap.product?.name ?? null;
  const lens = snap.lens ?? snap.lensType ?? null;
  const submitted = Date.parse(row.submittedAt ?? row.createdAt);
  const flag = snap.flags?.find((f) => f?.message)?.message ?? null;
  return {
    id: row.id,
    orderId: row.orderId,
    clientId: row.clientId,
    clientName: snap.clientName ?? names.get(row.clientId) ?? 'Client',
    status: row.status,
    priority: row.priority === 'high' ? 'high' : 'normal',
    claimedBy: row.claimedBy ?? null,
    description: [frame, lens].filter(Boolean).join(' · ') || 'Rx order',
    pd: typeof snap.measurements?.pd === 'number' ? snap.measurements.pd : null,
    anomaly: flag ?? ((row.flagsOpen ?? 0) > 0 ? 'Flagged for attention' : null),
    minutesWaiting: Number.isFinite(submitted) ? Math.max(0, Math.round((now - submitted) / 60_000)) : 0,
  };
}

/** "2m", "1h 5m", "3d" */
export function formatWaiting(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.floor(minutes / (24 * 60))}d`;
}

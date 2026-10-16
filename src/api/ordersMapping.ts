/**
 * Rx orders for the Orders tab.
 *
 * Foundry's rx-operations module has 12 states. The floor thinks in five stages
 * (V2 plan §4): Awaiting Rx · In review · Ready for lab · At lab · Ready for pickup.
 * `GET /api/admin/rx-pipeline/orders` returns every order (it ignores a state
 * filter), so grouping and filtering happen here.
 */

export type OrderStage = 'awaiting_rx' | 'in_review' | 'ready_for_lab' | 'at_lab' | 'ready_for_pickup' | 'done';

export const ORDER_STAGES: Array<{ key: OrderStage; label: string }> = [
  { key: 'awaiting_rx', label: 'Awaiting Rx' },
  { key: 'in_review', label: 'In review' },
  { key: 'ready_for_lab', label: 'Ready for lab' },
  { key: 'at_lab', label: 'At lab' },
  { key: 'ready_for_pickup', label: 'Ready for pickup' },
];

const STATE_TO_STAGE: Record<string, OrderStage> = {
  awaiting_rx: 'awaiting_rx',
  rx_submitted: 'in_review',
  optician_review: 'in_review',
  ready_for_lab: 'ready_for_lab',
  at_lab: 'at_lab',
  received_from_lab: 'at_lab',
  ready_for_pickup: 'ready_for_pickup',
  ready_to_ship: 'ready_for_pickup',
  shipped: 'done',
  delivered: 'done',
  picked_up: 'done',
  fulfilled: 'done',
};

export interface FoundryRxOrderRow {
  id: string;
  state: string;
  stateEnteredAt?: string | null;
  customerName?: string | null;
  canonicalCustomerId?: string | null;
  customerId?: string | null;
  frameSku?: string | null;
  frameColour?: string | null;
  lensType?: string | null;
  depositCents?: number | null;
  totalCents?: number | null;
  estimatedCompletionDate?: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  stage: OrderStage;
  state: string;
  clientId: string | null;
  clientName: string;
  /** "Hatley Tortoise · Progressive" */
  description: string;
  /** Whole days in the current state. */
  daysInStage: number;
  depositCents: number;
  totalCents: number;
  balanceCents: number;
  estimatedReady: string | null;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s-])\S/g, (m) => m.toUpperCase());
}

/** "HATLEY-TORTOISE" → "Hatley Tortoise" */
export function frameLabel(sku: string | null | undefined): string | null {
  if (!sku) return null;
  return titleCase(sku.replace(/[-_]+/g, ' ').trim());
}

const LENS_LABELS: Record<string, string> = {
  progressive: 'Progressive',
  single_vision: 'Single vision',
  sv: 'Single vision',
  bifocal: 'Bifocal',
  tint: 'Tint',
};

export function toOrderItem(row: FoundryRxOrderRow, now = Date.now()): OrderItem {
  const entered = Date.parse(row.stateEnteredAt ?? row.createdAt);
  const deposit = Number(row.depositCents ?? 0) || 0;
  const total = Number(row.totalCents ?? 0) || 0;
  const parts = [frameLabel(row.frameSku), row.lensType ? LENS_LABELS[row.lensType] ?? titleCase(row.lensType) : null].filter(Boolean);
  return {
    id: row.id,
    stage: STATE_TO_STAGE[row.state] ?? 'in_review',
    state: row.state,
    clientId: row.canonicalCustomerId ?? row.customerId ?? null,
    clientName: row.customerName?.trim() || 'Client',
    description: parts.join(' · ') || 'Rx order',
    daysInStage: Number.isFinite(entered) ? Math.max(0, Math.floor((now - entered) / 86_400_000)) : 0,
    depositCents: deposit,
    totalCents: total,
    balanceCents: Math.max(0, total - deposit),
    estimatedReady: row.estimatedCompletionDate ?? null,
  };
}

/**
 * How urgent an order's age is for its stage. Awaiting Rx follows the deck's
 * day 3 / 7 / 14 cadence with a stale alert at 21+.
 */
export function ageLevel(item: Pick<OrderItem, 'stage' | 'daysInStage'>): 'ok' | 'warn' | 'late' {
  if (item.stage === 'awaiting_rx') return item.daysInStage >= 21 ? 'late' : item.daysInStage >= 7 ? 'warn' : 'ok';
  if (item.stage === 'ready_for_pickup') return item.daysInStage >= 14 ? 'late' : item.daysInStage >= 7 ? 'warn' : 'ok';
  if (item.stage === 'in_review' || item.stage === 'ready_for_lab') return item.daysInStage >= 2 ? 'late' : item.daysInStage >= 1 ? 'warn' : 'ok';
  return 'ok';
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

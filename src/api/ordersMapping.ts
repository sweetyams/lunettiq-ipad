/**
 * Rx orders for the Orders tab.
 *
 * Foundry's rx-operations module has 12 states. The floor thinks in six stages,
 * named the way the store talks about them (gap checklist, Nov 2026):
 *   Paid, waiting for Rx · Pending approval · Preparing for the lab · At the lab ·
 *   Arrived, to check · Ready for pickup.
 * "In review" is gone: Seren saw no use for it and the optician asked for
 * "Pending approval", so Rx submitted + optician review are one stage.
 * `GET /api/admin/rx-pipeline/orders` returns every order (it ignores a state
 * filter), so grouping and filtering happen here.
 */
import { leadTimeStatus, type Lateness } from '@/src/features/orders/leadTime';

export type OrderStage = 'awaiting_rx' | 'pending_approval' | 'ready_for_lab' | 'at_lab' | 'arrived' | 'ready_for_pickup' | 'done';

export const ORDER_STAGES: Array<{ key: OrderStage; label: string; labelFr: string }> = [
  { key: 'awaiting_rx', label: 'Paid, waiting for Rx', labelFr: 'Payé, en attente d’ordonnance' },
  { key: 'pending_approval', label: 'Pending approval', labelFr: 'En attente d’approbation' },
  { key: 'ready_for_lab', label: 'Preparing for the lab', labelFr: 'Préparation pour le labo' },
  { key: 'at_lab', label: 'At the lab', labelFr: 'Au labo' },
  { key: 'arrived', label: 'Arrived, to check', labelFr: 'Reçu, à vérifier' },
  { key: 'ready_for_pickup', label: 'Ready for pickup', labelFr: 'Prêt à récupérer' },
];

const STATE_TO_STAGE: Record<string, OrderStage> = {
  awaiting_rx: 'awaiting_rx',
  rx_submitted: 'pending_approval',
  optician_review: 'pending_approval',
  ready_for_lab: 'ready_for_lab',
  at_lab: 'at_lab',
  received_from_lab: 'arrived',
  ready_for_pickup: 'ready_for_pickup',
  ready_to_ship: 'ready_for_pickup',
  shipped: 'done',
  delivered: 'done',
  picked_up: 'done',
  fulfilled: 'done',
  // Closed without being made: off the open lists (they used to fall through to "Pending approval").
  cancelled: 'done',
  canceled: 'done',
  refunded: 'done',
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
  /** When the job could start (Rx in hand and paid). Not on Foundry yet; falls back to createdAt. */
  productionStartedAt?: string | null;
  /** Staff who took the order. Foundry asks: return `staffName` (or `createdByName`). */
  staffName?: string | null;
  createdByName?: string | null;
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
  /** Purchase date (order created). */
  purchasedAt: string;
  /** Who took the order, when Foundry sends it. */
  staffName: string | null;
  /** Against the quoted 10–12 business days; null when not in production. */
  lateness: Lateness | null;
  businessDays: number | null;
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
  const lead = leadTimeStatus({ state: row.state, createdAt: row.createdAt, productionStartedAt: row.productionStartedAt }, now);
  const parts = [frameLabel(row.frameSku), row.lensType ? LENS_LABELS[row.lensType] ?? titleCase(row.lensType) : null].filter(Boolean);
  return {
    id: row.id,
    stage: STATE_TO_STAGE[row.state] ?? 'pending_approval',
    state: row.state,
    clientId: row.canonicalCustomerId ?? row.customerId ?? null,
    clientName: row.customerName?.trim() || 'Client',
    description: parts.join(' · ') || 'Rx order',
    daysInStage: Number.isFinite(entered) ? Math.max(0, Math.floor((now - entered) / 86_400_000)) : 0,
    depositCents: deposit,
    totalCents: total,
    balanceCents: Math.max(0, total - deposit),
    estimatedReady: row.estimatedCompletionDate ?? null,
    purchasedAt: row.createdAt,
    staffName: row.staffName?.trim() || row.createdByName?.trim() || null,
    lateness: lead?.lateness ?? null,
    businessDays: lead?.businessDays ?? null,
  };
}

/** Stage label in the staff UI language. */
export function stageLabel(stage: OrderStage, lang: 'en' | 'fr' = 'en'): string {
  const s = ORDER_STAGES.find((x) => x.key === stage);
  if (!s) return lang === 'fr' ? 'Terminé' : 'Done';
  return lang === 'fr' ? s.labelFr : s.label;
}

/** Orders past the quoted lead time, latest first (Floor's daily status). */
export function lateOrders(items: OrderItem[]): OrderItem[] {
  return items
    .filter((o) => o.lateness === 'late' || o.lateness === 'running_late')
    .sort((a, b) => (b.businessDays ?? 0) - (a.businessDays ?? 0));
}

/**
 * How urgent an order's age is for its stage. Awaiting Rx follows the deck's
 * day 3 / 7 / 14 cadence with a stale alert at 21+.
 */
export function ageLevel(item: Pick<OrderItem, 'stage' | 'daysInStage'>): 'ok' | 'warn' | 'late' {
  if (item.stage === 'awaiting_rx') return item.daysInStage >= 21 ? 'late' : item.daysInStage >= 7 ? 'warn' : 'ok';
  if (item.stage === 'ready_for_pickup') return item.daysInStage >= 14 ? 'late' : item.daysInStage >= 7 ? 'warn' : 'ok';
  if (item.stage === 'arrived') return item.daysInStage >= 2 ? 'late' : item.daysInStage >= 1 ? 'warn' : 'ok';
  if (item.stage === 'pending_approval' || item.stage === 'ready_for_lab') return item.daysInStage >= 2 ? 'late' : item.daysInStage >= 1 ? 'warn' : 'ok';
  return 'ok';
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

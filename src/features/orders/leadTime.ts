/**
 * Lab lead time (gap checklist, Orders): Lunettiq quotes clients 10 to 12 business
 * days from order to pickup. An order still with the lab past 10 business days is
 * "running late"; past 12 it is "late". Weekends don't count. Statutory holidays are
 * not modelled yet (Foundry should own a store calendar; see the Foundry API doc).
 */

export const LEAD_TIME = { warnAfter: 10, lateAfter: 12 } as const;

/** States where the store is still waiting on the lab or on itself to finish the job. */
const IN_PRODUCTION = new Set(['rx_submitted', 'optician_review', 'ready_for_lab', 'at_lab', 'received_from_lab']);

/** Whole business days (Mon–Fri) between two instants, not counting the start day. */
export function businessDaysBetween(fromIso: string | number | Date, to: number | Date = Date.now()): number {
  const start = new Date(fromIso);
  const end = new Date(to);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return 0;
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  let days = 0;
  while (d < last) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) days += 1;
  }
  return days;
}

/** The calendar date `n` business days after `fromIso` (the promised pickup date). */
export function addBusinessDays(fromIso: string | number | Date, n: number): Date {
  const d = new Date(fromIso);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d;
}

export type Lateness = 'on_time' | 'running_late' | 'late';

export interface LeadTimeStatus {
  lateness: Lateness;
  businessDays: number;
  /** Promised pickup at the end of the quoted window (12 business days). */
  promisedBy: Date;
}

/**
 * How an order is doing against the quoted lead time. Only orders in production
 * are measured: Awaiting Rx has its own reminder cadence and pickup is the client's
 * move. The clock starts when the job could start: the order's paid/created date,
 * or `productionStartedAt` when Foundry provides it.
 */
export function leadTimeStatus(
  order: { state: string; createdAt: string; productionStartedAt?: string | null },
  now: number = Date.now(),
): LeadTimeStatus | null {
  if (!IN_PRODUCTION.has(order.state)) return null;
  const start = order.productionStartedAt ?? order.createdAt;
  const businessDays = businessDaysBetween(start, now);
  const lateness: Lateness = businessDays > LEAD_TIME.lateAfter ? 'late' : businessDays > LEAD_TIME.warnAfter ? 'running_late' : 'on_time';
  return { lateness, businessDays, promisedBy: addBusinessDays(start, LEAD_TIME.lateAfter) };
}

/** Days an order has been paid with no prescription; the client reminder goes out at 14. */
export const RX_REMINDER_DAY = 14;

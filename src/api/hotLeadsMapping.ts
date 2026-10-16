/**
 * Smart Discounts call queue (V2 plan WS5, deck p.7).
 *
 * `GET /api/admin/hot-leads/queue` returns open / day-3 / day-7 opportunities,
 * ranked by score, with the client's name and phone joined in.
 */

export interface FoundryHotLeadRow {
  id: string;
  customerId: string;
  status: string;
  priority?: 'hot' | 'warm' | 'cold' | string;
  score?: number;
  discountTierAuthorized?: number | null;
  signals?: { emailOpens?: number; returnVisits?: number; quoteViews?: number; smsClicks?: number } | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  daysSinceCreated?: number;
  createdAt: string;
  topFrame?: { productId?: string; title?: string | null } | null;
}

export type FollowUpDue = 'call_now' | 'last_chance' | 'email_sent' | 'new';

export interface FollowUp {
  id: string;
  clientId: string;
  clientName: string;
  phone: string | null;
  frame: string | null;
  day: number;
  due: FollowUpDue;
  priority: 'hot' | 'warm' | 'cold';
  discountPercent: number;
  /** "Email opened 2× · visited twice" */
  signalsLabel: string | null;
}

export const DUE_LABELS: Record<FollowUpDue, string> = {
  call_now: 'Call now',
  last_chance: 'Last chance',
  email_sent: 'Email sent',
  new: 'New',
};

export function dueFor(status: string, day: number): FollowUpDue {
  if (status === 'day14_sent' || day >= 13) return 'last_chance';
  if (status === 'day7_queued' || day >= 7) return 'call_now';
  if (status === 'day3_sent' || day >= 3) return 'email_sent';
  return 'new';
}

export function signalsLabel(s: FoundryHotLeadRow['signals']): string | null {
  if (!s) return null;
  const parts: string[] = [];
  if (s.emailOpens) parts.push(`Email opened ${s.emailOpens}×`);
  if (s.returnVisits) parts.push(s.returnVisits === 1 ? 'Came back once' : `Came back ${s.returnVisits}×`);
  if (s.quoteViews) parts.push(`Viewed quote ${s.quoteViews}×`);
  if (s.smsClicks) parts.push(`Tapped SMS ${s.smsClicks}×`);
  return parts.length ? parts.join(' · ') : null;
}

function frameTitle(t: string | null | undefined): string | null {
  if (!t) return null;
  // "MARAIS © BLUE" → "Marais © Blue"
  return t.toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}

export function toFollowUp(row: FoundryHotLeadRow, now = Date.now()): FollowUp {
  const day = row.daysSinceCreated ?? Math.max(0, Math.floor((now - Date.parse(row.createdAt)) / 86_400_000));
  const priority = row.priority === 'hot' || row.priority === 'cold' ? row.priority : 'warm';
  return {
    id: row.id,
    clientId: row.customerId,
    clientName: row.customerName?.trim() || 'Client',
    phone: row.customerPhone ?? null,
    frame: frameTitle(row.topFrame?.title),
    day,
    due: dueFor(row.status, day),
    priority,
    discountPercent: Number(row.discountTierAuthorized ?? 0) || 0,
    signalsLabel: signalsLabel(row.signals),
  };
}

const DUE_ORDER: Record<FollowUpDue, number> = { last_chance: 0, call_now: 1, email_sent: 2, new: 3 };

/** Most urgent first, then hottest. */
export function sortFollowUps(items: FollowUp[]): FollowUp[] {
  const p = { hot: 0, warm: 1, cold: 2 } as const;
  return items.slice().sort((a, b) => DUE_ORDER[a.due] - DUE_ORDER[b.due] || p[a.priority] - p[b.priority] || b.day - a.day);
}

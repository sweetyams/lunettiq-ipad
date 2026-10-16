import type { Client } from './clients.types';

export interface DuplicateCheckParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface DuplicateClient {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
  /** Why it matched, for the staff member deciding. */
  reason: 'email' | 'phone' | 'name';
}

const norm = (s: string | null | undefined) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const last10 = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '').slice(-10);

/** Search terms for Foundry's trigram client search (email, then last name, then first name). */
export function duplicateSearchTerms(p: DuplicateCheckParams): string[] {
  const terms = [p.email?.trim(), p.lastName?.trim(), p.lastName?.trim() ? undefined : p.firstName?.trim()];
  return [...new Set(terms.filter((t): t is string => !!t && t.length >= 2))];
}

/**
 * Likely duplicates among search results: same email, same 10-digit phone,
 * or same last name with a matching (or prefix-matching) first name.
 * Accent- and case-insensitive. Strongest reason first.
 */
export function findLikelyDuplicates(p: DuplicateCheckParams, candidates: Client[]): DuplicateClient[] {
  const email = norm(p.email);
  const phone = last10(p.phone);
  const first = norm(p.firstName);
  const lastName = norm(p.lastName);
  const rank = { email: 0, phone: 1, name: 2 } as const;
  const out = new Map<string, DuplicateClient>();
  for (const c of candidates) {
    let reason: DuplicateClient['reason'] | null = null;
    if (email && norm(c.email) === email) reason = 'email';
    else if (phone.length === 10 && last10(c.phone) === phone) reason = 'phone';
    else if (lastName && norm(c.lastName) === lastName && (!first || norm(c.firstName).startsWith(first) || first.startsWith(norm(c.firstName) || '\u0000'))) reason = 'name';
    if (!reason) continue;
    const prev = out.get(c.id);
    if (prev && rank[prev.reason] <= rank[reason]) continue;
    out.set(c.id, {
      id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
      fullName: [c.firstName, c.lastName].filter(Boolean).join(' '), reason,
    });
  }
  return [...out.values()].sort((a, b) => rank[a.reason] - rank[b.reason]);
}

import type { Prescription } from '@/src/api/prescriptions.types';

export const RX_TYPE_LABEL: Record<NonNullable<Prescription['type']>, string> = {
  single_vision: 'Single vision',
  progressive: 'Progressive',
  bifocal: 'Bifocal',
  reading: 'Reading',
  other: 'Other',
};

/** Signed diopters ("+1.25", "−0.50", "Plano"); axis/PD as plain numbers. */
export function formatDiopter(v: number | null | undefined): string {
  if (v == null) return '—';
  if (v === 0) return 'Plano';
  return `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;
}

export function formatPlain(v: number | null | undefined): string {
  return v == null ? '—' : String(v);
}

/** Review status as a badge: tone + label. */
export function rxStatus(rx: Prescription): { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string } {
  const expired = rx.status === 'expired' || (!!rx.expiresAt && Date.parse(rx.expiresAt) < Date.now());
  if (expired) return { tone: 'warning', label: 'Expired' };
  if (rx.status === 'discrepancy') return { tone: 'danger', label: 'Discrepancy' };
  if (rx.verified) return { tone: 'success', label: 'Verified' };
  return { tone: 'neutral', label: 'Not verified' };
}

/** "Progressive" when the type is known, else "Prescription". */
export function rxTypeLabel(rx: Prescription): string {
  return rx.type ? RX_TYPE_LABEL[rx.type] : 'Prescription';
}

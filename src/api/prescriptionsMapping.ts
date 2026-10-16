import type { Prescription } from './prescriptions.types';

/**
 * Foundry `prescriptions` row (src/lib/db/schema/lunettiq.ts): optics are
 * text, the date is `prescriptionDate`, review is `status`, and there is no
 * lens type or expiry.
 */
export interface FoundryPrescriptionRow {
  id: string;
  customerId: string;
  sphereOd?: string | null;
  cylinderOd?: string | null;
  axisOd?: number | null;
  addOd?: string | null;
  sphereOs?: string | null;
  cylinderOs?: string | null;
  axisOs?: number | null;
  addOs?: string | null;
  pdType?: string | null;
  pdSingle?: string | null;
  pdRight?: string | null;
  pdLeft?: string | null;
  prescriptionDate?: string | null;
  prescriberName?: string | null;
  clinicName?: string | null;
  status?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  discrepancyNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

function num(v: string | number | null | undefined): number | undefined {
  if (v == null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

const STATUSES = ['submitted', 'verified', 'discrepancy', 'expired'] as const;

export function toPrescription(r: FoundryPrescriptionRow): Prescription {
  const status = STATUSES.find((s) => s === r.status) ?? 'submitted';
  // A single PD is split evenly so each eye's column reads naturally.
  const single = num(r.pdSingle);
  return {
    id: r.id,
    clientId: r.customerId,
    status,
    sphereOd: num(r.sphereOd),
    cylinderOd: num(r.cylinderOd),
    axisOd: num(r.axisOd),
    addOd: num(r.addOd),
    sphereOs: num(r.sphereOs),
    cylinderOs: num(r.cylinderOs),
    axisOs: num(r.axisOs),
    addOs: num(r.addOs),
    pdRight: num(r.pdRight) ?? (single != null ? single / 2 : undefined),
    pdLeft: num(r.pdLeft) ?? (single != null ? single / 2 : undefined),
    prescribedBy: r.prescriberName ?? undefined,
    clinicName: r.clinicName ?? undefined,
    prescribedAt: r.prescriptionDate ?? undefined,
    verified: status === 'verified',
    verifiedBy: r.verifiedBy ?? undefined,
    verifiedAt: r.verifiedAt ?? undefined,
    notes: r.discrepancyNotes ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? r.createdAt,
  };
}

/** Newest exam first (falls back to when it was entered). */
export function sortPrescriptions(list: Prescription[]): Prescription[] {
  const at = (p: Prescription) => Date.parse(p.prescribedAt ?? p.createdAt) || 0;
  return list.slice().sort((a, b) => at(b) - at(a));
}

/** "+1.25" / "-0.50" / "0.00" — Foundry stores optics as text. */
function diopterText(v: number | undefined): string | null {
  if (v == null || !Number.isFinite(v)) return null;
  return `${v > 0 ? '+' : v < 0 ? '-' : ''}${Math.abs(v).toFixed(2)}`;
}
function plainText(v: number | undefined): string | null {
  return v == null || !Number.isFinite(v) ? null : String(v);
}

/** iPad form → Foundry prescriptions insert (POST /api/admin/prescriptions inserts the body as-is). */
export function toFoundryPrescriptionInput(p: import('./prescriptions.types').CreatePrescriptionPayload) {
  const dual = p.pdRight != null && p.pdLeft != null;
  return {
    customerId: p.clientId,
    // Deprecated but NOT NULL; Foundry's intake flow uses the customer id here too.
    shopifyCustomerId: p.clientId,
    sphereOd: diopterText(p.sphereOd),
    cylinderOd: diopterText(p.cylinderOd),
    axisOd: p.axisOd ?? null,
    addOd: diopterText(p.addOd),
    sphereOs: diopterText(p.sphereOs),
    cylinderOs: diopterText(p.cylinderOs),
    axisOs: p.axisOs ?? null,
    addOs: diopterText(p.addOs),
    pdType: dual ? 'dual' : 'single',
    pdSingle: dual ? null : plainText(p.pdSingle),
    pdRight: dual ? plainText(p.pdRight) : null,
    pdLeft: dual ? plainText(p.pdLeft) : null,
    prescriptionDate: p.prescribedAt || null,
    prescriberName: p.prescribedBy?.trim() || null,
    clinicName: p.clinicName?.trim() || null,
    status: 'submitted',
  };
}

/**
 * One Rx approval request as the optician reviews it (GET /api/admin/rx-approvals/:id,
 * Foundry remote-approval getApprovalById). Snapshots come in two spellings — the
 * web's (rx.sphereOd, measurements.segHeightOd, order.lineItems[0]) and the demo
 * seed's (rx.odSph, lens, frame, stylistNote) — so everything is read tolerantly.
 * Pure, tested.
 */

/** Foundry's sign-off gates: every one of these sections marked reviewed. */
export const CHECKLIST_SECTIONS = ['rx', 'measurements', 'frame_lens', 'photos', 'flags', 'notes'] as const;
export type ChecklistSection = (typeof CHECKLIST_SECTIONS)[number];

export const SECTION_LABELS: Record<ChecklistSection, string> = {
  rx: 'Prescription',
  measurements: 'Measurements',
  frame_lens: 'Frame and lenses',
  photos: 'Photos',
  flags: 'Flags',
  notes: 'Stylist notes',
};

/** The web's return reasons (admin rx-approvals page), same codes. */
export const RETURN_REASONS = [
  { key: 'remeasure_pd', label: 'Remeasure PD' },
  { key: 'retake_photos', label: 'Retake photos' },
  { key: 'wrong_frame_size', label: 'Wrong frame size' },
  { key: 'clarify_rx', label: 'Clarify Rx with prescriber' },
  { key: 'missing_info', label: 'Missing information' },
  { key: 'other', label: 'Other' },
] as const;

export const REJECT_CATEGORIES = [
  { key: 'rx_invalid', label: 'Prescription not valid' },
  { key: 'not_suitable', label: 'Lens not suitable' },
  { key: 'clinical_concern', label: 'Clinical concern' },
  { key: 'other', label: 'Other' },
] as const;

/** Text the optician attests to when signing (the web's wording, both languages). */
export const ATTESTATION = {
  version: '1.0',
  fr: 'J’ai vérifié l’ordonnance, les mesures et le choix de lentilles pour cette commande et j’en autorise la fabrication.',
  en: 'I have checked the prescription, the measurements and the lens choice for this order and authorise it to be made.',
};

export interface FoundryApprovalFlag {
  id: string;
  ruleCode: string;
  severity: string;
  details?: { message?: string } | null;
  resolvedAt: string | null;
}

export interface FoundryApprovalDetail {
  id: string;
  orderId: string;
  clientId: string | null;
  status: string;
  priority?: string | null;
  snapshot?: Record<string, unknown> | null;
  claimedBy: string | null;
  claimantName?: string | null;
  clientName?: string | null;
  submittedAt?: string | null;
  flagsOpen?: number | null;
  flags?: FoundryApprovalFlag[];
  reviewSession?: { checklist?: Record<string, { markedAt?: string | null } | null> | null; dwellSeconds?: number | null } | null;
  signature?: { signedAt: string; permitNumberAtSigning?: string | null } | null;
}

export interface Row { label: string; value: string }

export interface ApprovalView {
  id: string;
  orderId: string;
  clientId: string | null;
  clientName: string;
  status: string;
  priority: 'normal' | 'high';
  claimedBy: string | null;
  claimantName: string | null;
  rx: Row[];
  measurements: Row[];
  frameLens: Row[];
  photos: string[];
  /** Open flags first. */
  flags: { id: string; label: string; severity: 'block' | 'warn' | 'info'; resolved: boolean }[];
  notes: string | null;
  reviewed: Record<ChecklistSection, boolean>;
  dwellSeconds: number;
  /** Seconds of review Foundry needs before sign-off (60 standard, 120 flagged by default). */
  dwellFloor: number;
  blockingFlags: number;
  signedAt: string | null;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const first = (o: Obj, ...keys: string[]) => keys.map((k) => o[k]).find((v) => v != null && v !== '');
const text = (v: unknown) => (v == null || v === '' ? null : String(v));

/** "-1.5" → "−1.50", "+0.75"; axis and PD stay as written. */
function power(v: unknown): string | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return text(v);
  const s = Math.abs(n).toFixed(2);
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : '0.00';
}

function eye(rx: Obj, side: 'od' | 'os'): string | null {
  const S = side === 'od' ? 'Od' : 'Os';
  const sph = power(first(rx, `sphere${S}`, `${side}Sph`, `${side}_sph`));
  const cyl = power(first(rx, `cylinder${S}`, `${side}Cyl`, `${side}_cyl`));
  const axis = text(first(rx, `axis${S}`, `${side}Axis`, `${side}_axis`));
  const add = power(first(rx, `add${S}`, `${side}Add`, `${side}_add`));
  const parts = [sph && `SPH ${sph}`, cyl && `CYL ${cyl}`, axis && `AXIS ${axis}°`, add && `ADD ${add}`].filter(Boolean);
  return parts.length ? parts.join('  ') : null;
}

const tidy = (s: string | null) => (s ? s.replace(/_/g, ' ').toLowerCase().replace(/(^|[\s-])\S/g, (m) => m.toUpperCase()) : null);

export function toApprovalView(d: FoundryApprovalDetail, opts: { dwellFloorStandard?: number; dwellFloorFlagged?: number } = {}): ApprovalView {
  const snap = obj(d.snapshot);
  const rx = obj(first(snap, 'rx', 'prescription'));
  const m = obj(snap.measurements);
  const line = obj((obj(snap.order).lineItems as unknown[] | undefined)?.[0]);

  const pd = first(rx, 'pdSingle') ?? (rx.pdRight != null ? `${rx.pdRight} / ${rx.pdLeft ?? '—'}` : undefined);
  const rxRows: Row[] = [
    { label: 'Right (OD)', value: eye(rx, 'od') },
    { label: 'Left (OS)', value: eye(rx, 'os') },
    { label: 'PD', value: text(pd) },
    { label: 'Prescriber', value: text(first(rx, 'prescriberName', 'prescriber')) },
  ].filter((r): r is Row => !!r.value);

  const mRows: Row[] = [
    { label: 'PD', value: text(first(m, 'pdSingle', 'pd')) },
    { label: 'Seg height', value: text(first(m, 'segHeight')) ?? ([m.segHeightOd, m.segHeightOs].some((v) => v != null) ? `${m.segHeightOd ?? '—'} / ${m.segHeightOs ?? '—'}` : null) },
    { label: 'Vertex', value: text(first(m, 'vertex')) },
    { label: 'Method', value: tidy(text(m.method)) },
  ].filter((r): r is Row => !!r.value).map((r) => (r.label === 'Method' || /mm$/.test(r.value) ? r : { ...r, value: `${r.value} mm` }));

  const treatments = Array.isArray(line.lensTreatments) ? (line.lensTreatments as string[]).join(', ') : null;
  const frameLens: Row[] = [
    { label: 'Frame', value: tidy(text(first(snap, 'frame')) ?? ([line.frameSku, line.frameColour].filter(Boolean).join(' ') || null)) },
    { label: 'Lenses', value: tidy(text(first(snap, 'lens')) ?? ([line.lensType, line.lensMaterial].filter(Boolean).join(' · ') || null)) },
    { label: 'Treatments', value: treatments || null },
  ].filter((r): r is Row => !!r.value);

  const photos = (Array.isArray(snap.photos) ? snap.photos : [])
    .map((p) => (typeof p === 'string' ? p : text(obj(p).url)))
    .filter((u): u is string => !!u);

  const severity = (s: string): 'block' | 'warn' | 'info' => (s === 'block' ? 'block' : s === 'warn' ? 'warn' : 'info');
  const flags = [
    ...(d.flags ?? []).map((f) => ({
      id: f.id,
      label: f.details?.message ?? tidy(f.ruleCode) ?? f.ruleCode,
      severity: severity(f.severity),
      resolved: !!f.resolvedAt,
    })),
    // Seeded snapshots carry flags inline; shown, but only Foundry's flag rows block sign-off.
    ...(!d.flags?.length && Array.isArray(snap.flags)
      ? (snap.flags as unknown[]).map((f, i) => ({ id: `snap-${i}`, label: text(obj(f).message) ?? tidy(text(obj(f).type)) ?? 'Flag', severity: 'warn' as const, resolved: false }))
      : []),
  ].sort((a, b) => Number(a.resolved) - Number(b.resolved));

  const checklist = obj(d.reviewSession?.checklist);
  const reviewed = Object.fromEntries(CHECKLIST_SECTIONS.map((s) => [s, !!obj(checklist[s]).markedAt])) as Record<ChecklistSection, boolean>;
  const high = d.priority === 'high' || d.priority === 'flagged' || d.priority === 'rush';

  return {
    id: d.id,
    orderId: d.orderId,
    clientId: d.clientId ?? (text(snap.clientId) as string | null),
    clientName: d.clientName?.trim() || text(snap.clientName) || 'Client',
    status: d.status,
    priority: high ? 'high' : 'normal',
    claimedBy: d.claimedBy,
    claimantName: d.claimantName ?? null,
    rx: rxRows,
    measurements: mRows,
    frameLens,
    photos,
    flags,
    notes: text(first(snap, 'stylistNotes', 'stylistNote', 'notes')),
    reviewed,
    dwellSeconds: d.reviewSession?.dwellSeconds ?? 0,
    dwellFloor: d.priority === 'flagged' ? opts.dwellFloorFlagged ?? 120 : opts.dwellFloorStandard ?? 60,
    blockingFlags: (d.flags ?? []).filter((f) => f.severity === 'block' && !f.resolvedAt).length,
    signedAt: d.signature?.signedAt ?? null,
  };
}

/** Why Sign off isn't available yet, in the order the optician fixes them; empty = ready. */
export function signOffBlockers(v: ApprovalView, dwellSoFar = v.dwellSeconds): string[] {
  const out: string[] = [];
  const left = CHECKLIST_SECTIONS.filter((s) => !v.reviewed[s]);
  if (left.length) out.push(`Mark ${left.length === 1 ? SECTION_LABELS[left[0]!].toLowerCase() : `${left.length} sections`} reviewed`);
  if (v.blockingFlags) out.push(`Resolve ${v.blockingFlags} blocking flag${v.blockingFlags === 1 ? '' : 's'}`);
  if (dwellSoFar < v.dwellFloor) out.push(`Keep reviewing ${v.dwellFloor - Math.floor(dwellSoFar)}s more`);
  return out;
}

/** Foundry's sign-off refusals, in words (412 details.failed, 403 credential, 422 cap). */
export function signOffErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: { failed?: string[]; reason?: string } } | null;
  const failed = e?.details?.failed ?? [];
  if (failed.includes('checklist')) return 'Every section has to be marked reviewed first.';
  if (failed.includes('dwell')) return 'Foundry needs a little more review time. Keep the request open and try again.';
  if (failed.includes('flags_open')) return 'A blocking flag is still open.';
  if (failed.includes('session')) return 'The review session ended. Claim the request again.';
  if (e?.code === 'CREDENTIAL_INVALID') return `Your optician credential can’t sign: ${e.details?.reason ?? 'check it in Foundry'}.`;
  if (e?.code === 'DAILY_CAP') return e.message ?? 'Daily sign-off limit reached.';
  if (e?.code === 'FORBIDDEN') return 'Only the optician who claimed it can sign it off.';
  return e?.message ?? 'Sign-off didn’t go through. Try again.';
}

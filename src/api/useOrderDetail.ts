/**
 * Single Rx order: detail, timeline, transitions, notes, approval request and Rx
 * capture (photo → OCR → attach). Routes per Foundry main
 * (`src/app/(project)/api/admin/rx-pipeline/orders/[id]/*`, `/api/rx/scan`, `/api/rx/capture`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface OrderEvent {
  id: string;
  eventType: string;
  fromState?: string | null;
  toState?: string | null;
  note?: string | null;
  actorName?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  /** Foundry keeps event text here: `{note}` for notes and moves, `{reason}` for flags. */
  payload?: Record<string, unknown> | null;
}

/** Event text wherever Foundry put it (rx_order_events.payload.note / .reason). Pure, tested. */
export function eventText(e: OrderEvent): string | null {
  const p = e.payload ?? e.metadata ?? {};
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return pick(e.note) ?? pick(p.note) ?? pick(p.reason) ?? pick(p.message) ?? null;
}

/** Collapse runs of the same event on the same day ("Stale: 7+ days" flagged hourly) into one row with a count. */
export function collapseEvents(events: OrderEvent[]): Array<OrderEvent & { text: string | null; count: number }> {
  const out: Array<OrderEvent & { text: string | null; count: number }> = [];
  for (const e of events) {
    const text = eventText(e);
    const prev = out[out.length - 1];
    if (prev && prev.eventType === e.eventType && prev.text === text && prev.toState === e.toState
      && prev.createdAt.slice(0, 10) === e.createdAt.slice(0, 10)) {
      prev.count += 1;
      continue;
    }
    out.push({ ...e, text, count: 1 });
  }
  return out;
}

export interface OrderDetail {
  id: string;
  state: string;
  customerName?: string | null;
  customerId?: string | null;
  canonicalCustomerId?: string | null;
  frameSku?: string | null;
  frameColour?: string | null;
  lensType?: string | null;
  depositCents?: number | null;
  totalCents?: number | null;
  redoCount?: number | null;
  estimatedCompletionDate?: string | null;
  sourceOrderNumber?: string | null;
  prescription?: { id: string } | null;
  createdAt: string;
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ['rx-pipeline', 'orders', id, 'detail'],
    queryFn: () => api.get<OrderDetail>(`/api/admin/rx-pipeline/orders/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useOrderTimeline(id: string | null) {
  return useQuery({
    queryKey: ['rx-pipeline', 'orders', id, 'timeline'],
    queryFn: async () => {
      const rows = await api.get<OrderEvent[] | { events?: OrderEvent[] }>(`/api/admin/rx-pipeline/orders/${id}/timeline`);
      return Array.isArray(rows) ? rows : rows?.events ?? [];
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

function useInvalidateOrder() {
  const qc = useQueryClient();
  return (id: string) => {
    qc.invalidateQueries({ queryKey: ['rx-pipeline'] });
    qc.invalidateQueries({ queryKey: ['rx-pipeline', 'orders', id] });
  };
}

/** POST /orders/{id}/transition — 409 when the move isn't allowed from the current state. */
export function useTransitionOrder() {
  const invalidate = useInvalidateOrder();
  return useMutation({
    mutationFn: ({ id, toState, note, credential }: { id: string; toState: string; note?: string; credential?: string }) =>
      api.post<OrderDetail>(`/api/admin/rx-pipeline/orders/${id}/transition`, { toState, note, credential }),
    onSuccess: (_, { id }) => invalidate(id),
  });
}

export function useAddOrderNote() {
  const invalidate = useInvalidateOrder();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.post(`/api/admin/rx-pipeline/orders/${id}/notes`, { note }),
    onSuccess: (_, { id }) => invalidate(id),
  });
}

/**
 * Request optician approval: Foundry's readiness check requires the order to be in
 * optician_review, so move it there first (from rx_submitted), then open the request.
 */
export function useRequestApproval() {
  const invalidate = useInvalidateOrder();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, state, note }: { id: string; state: string; note?: string }) => {
      if (state === 'rx_submitted') {
        await api.post(`/api/admin/rx-pipeline/orders/${id}/transition`, { toState: 'optician_review', note: note ?? 'Sent for optician approval' });
      }
      return api.post('/api/admin/rx-approvals', { orderId: id, notes: note });
    },
    onSuccess: (_, { id }) => {
      invalidate(id);
      qc.invalidateQueries({ queryKey: ['rx-approvals'] });
    },
  });
}

/** What `/api/rx/scan` reads off a prescription photo. */
export interface RxScanEye { sphere?: number | null; cylinder?: number | null; axis?: number | null; add?: number | null }
export interface RxScanResult {
  success?: boolean;
  od?: RxScanEye;
  os?: RxScanEye;
  pd?: number | null;
  pdRight?: number | null;
  pdLeft?: number | null;
  prescriptionDate?: string | null;
  prescriberName?: string | null;
  prescriberClinic?: string | null;
  /** Not returned yet (Foundry ask): the patient's name, to start or match a profile. */
  patientName?: string | null;
  confidence?: number | null;
  warnings?: string[];
}

/** Multipart upload of the photo to `/api/rx/scan` (AI-read, staff confirm). */
export async function scanRxPhoto(uri: string): Promise<RxScanResult> {
  const token = await api.getTokenForUpload();
  const form = new FormData();
  // React Native FormData file part.
  form.append('image', { uri, name: 'prescription.jpg', type: 'image/jpeg' } as unknown as Blob);
  const res = await fetch(`${api.baseUrl}/api/rx/scan`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'X-Found-Surface': 'tablet' },
    body: form,
  });
  const json = await res.json().catch(() => null) as { data?: RxScanResult; error?: { message?: string } } | RxScanResult | null;
  if (!res.ok || !json) throw new Error((json as { error?: { message?: string } } | null)?.error?.message ?? `Scan failed (${res.status})`);
  return ('data' in json && json.data ? json.data : json) as RxScanResult;
}

export interface RxCaptureInput {
  customerId: string;
  rxOrderId?: string;
  od: RxScanEye;
  os: RxScanEye;
  pd?: { single?: number | null; right?: number | null; left?: number | null };
  prescriber?: { name?: string | null; clinic?: string | null; date?: string | null };
  source: 'ocr' | 'manual';
  confidence?: number | null;
}

/** Map the form to Foundry's `/api/rx/capture` body. Pure, tested. */
export function toRxCaptureBody(input: RxCaptureInput) {
  const pd = input.pd ?? {};
  const pdType = pd.right != null && pd.left != null ? 'dual' : pd.single != null ? 'single' : undefined;
  return {
    submission: {
      od: input.od,
      os: input.os,
      ...(pdType ? { pd: { type: pdType, single: pd.single ?? undefined, right: pd.right ?? undefined, left: pd.left ?? undefined } } : {}),
      prescriber: { name: input.prescriber?.name ?? undefined, clinic: input.prescriber?.clinic ?? undefined, date: input.prescriber?.date ?? undefined },
      source: input.source,
      confidence: input.confidence ?? undefined,
    },
    auth: { type: 'staff' as const },
    customerId: input.customerId,
    ...(input.rxOrderId ? { rxOrderId: input.rxOrderId } : {}),
  };
}

/** Save a captured Rx; Foundry attaches it to the client's awaiting-Rx orders. */
export function useCaptureRx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RxCaptureInput) => api.post('/api/rx/capture', toRxCaptureBody(input)),
    onSuccess: (_, { customerId, rxOrderId }) => {
      qc.invalidateQueries({ queryKey: ['rx-pipeline'] });
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['clients', customerId] });
      if (rxOrderId) qc.invalidateQueries({ queryKey: ['rx-pipeline', 'orders', rxOrderId] });
    },
  });
}

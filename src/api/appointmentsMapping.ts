/**
 * Maps Foundry's raw `/api/scheduling` rows to the iPad's Appointment shape.
 *
 * Foundry returns appointment rows as stored: `customerId`, `title` (the service
 * name, e.g. "Eye exam"), `startsAt`/`endsAt`, no client name and no duration.
 * The iPad screens expect `clientId`, `clientName`, `type` and `duration`.
 * Until Foundry joins the client name into the list response, names are looked
 * up from `/api/clients/{id}` and cached for a few minutes.
 */
import { api } from './client';
import { lookupClientNames } from './clientNames';
import type { Appointment, AppointmentListParams, AppointmentStatus, InventoryHold } from './appointments.types';

export interface FoundryAppointmentRow {
  id: string;
  title?: string | null;
  customerId?: string | null;
  shopifyCustomerId?: string | null;
  staffId?: string | null;
  locationId?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string | null;
  reminderSentAt?: string | null;
  reminderPreference?: string | null;
  intakePayload?: { formType?: string } | null;
  createdAt: string;
  updatedAt: string;
  /** Present if Foundry starts joining the client name (preferred over a lookup). */
  clientName?: string | null;
  customerName?: string | null;
}

const NAME_SEPARATOR = ' — ';

/** "Eye exam — Camille Tremblay" → { type: "Eye exam", name: "Camille Tremblay" } */
export function splitTitle(title: string | null | undefined): { type: string; name: string | null } {
  const t = (title ?? '').trim();
  const i = t.indexOf(NAME_SEPARATOR);
  if (i === -1) return { type: t || 'Appointment', name: null };
  return { type: t.slice(0, i).trim() || 'Appointment', name: t.slice(i + NAME_SEPARATOR.length).trim() || null };
}

export function toAppointment(row: FoundryAppointmentRow, names: ReadonlyMap<string, string> = new Map()): Appointment {
  const { type, name: nameFromTitle } = splitTitle(row.title);
  const clientId = row.customerId ?? row.shopifyCustomerId ?? null;
  const duration = Math.max(0, Math.round((Date.parse(row.endsAt) - Date.parse(row.startsAt)) / 60_000)) || 0;
  const formType = row.intakePayload?.formType;
  return {
    id: row.id,
    clientId,
    clientName: row.clientName ?? row.customerName ?? (clientId ? names.get(clientId) : undefined) ?? nameFromTitle ?? null,
    type,
    status: row.status as AppointmentStatus,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    duration,
    staffId: row.staffId ?? null,
    staffName: null,
    locationId: row.locationId ?? null,
    notes: row.notes ?? null,
    intakeFormType: formType === 'eye-exam' || formType === 'styling' || formType === 'second-sight' ? formType : null,
    reminderSentAt: row.reminderSentAt ?? null,
    reminderPreference: row.reminderPreference === 'sms' || row.reminderPreference === 'email' ? row.reminderPreference : null,
    inventoryHoldCount: 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Foundry's list endpoint reads `date`, `dateFrom`/`dateTo`, `clientId`, `staffId`, `locationId`. */
export function toSchedulingParams(params?: AppointmentListParams & { clientId?: string }): Record<string, string> | undefined {
  if (!params) return undefined;
  const result: Record<string, string> = {};
  if (params.date) result.date = params.date;
  if (params.from) result.dateFrom = `${params.from}T00:00:00`;
  if (params.to) result.dateTo = `${params.to}T23:59:59`;
  if (params.locationId) result.locationId = params.locationId;
  if (params.staffId) result.staffId = params.staffId;
  if (params.clientId) result.clientId = params.clientId;
  return Object.keys(result).length > 0 ? result : undefined;
}

/** GET /api/scheduling → iPad Appointments (with client names resolved). */
export async function fetchAppointments(params?: AppointmentListParams & { clientId?: string }): Promise<Appointment[]> {
  const rows = await api.get<FoundryAppointmentRow[]>('/api/scheduling', { params: toSchedulingParams(params) });
  const list = Array.isArray(rows) ? rows : [];
  const needNames = [...new Set(
    list
      .filter((r) => !r.clientName && !r.customerName)
      .map((r) => r.customerId ?? r.shopifyCustomerId)
      .filter((id): id is string => !!id),
  )];
  const names = needNames.length > 0 ? await lookupClientNames(needNames) : new Map<string, string>();
  return list.map((r) => toAppointment(r, names));
}

// --- Holds (inventory protections) ---

export interface FoundryProtectionRow {
  id: string;
  familyId?: string | null;
  colour?: string | null;
  note?: string | null;
  reason?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

/** Foundry protection row → the hold card's shape. The note is what staff wrote when holding. */
export function toInventoryHold(row: FoundryProtectionRow): InventoryHold {
  const clientId = row.referenceType === 'customer' ? row.referenceId ?? null : null;
  return {
    id: row.id,
    productId: row.familyId ?? '',
    productName: row.note?.trim() || (row.colour ? `Frame · ${row.colour}` : 'Frame on hold'),
    variantId: null,
    variantTitle: null,
    reason: 'try_on_hold',
    appointmentId: row.referenceType === 'appointment' ? row.referenceId ?? null : null,
    clientId,
    expiresAt: row.expiresAt ?? '',
    createdAt: row.createdAt,
  };
}

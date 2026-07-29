// Appointment status flow:
// scheduled → confirmed → arrived → in_progress → completed
//                ↘ cancelled         ↗
//                ↘ no_show

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export type IntakeFormType = 'eye-exam' | 'styling' | 'second-sight' | null;

export interface Appointment {
  id: string;
  clientName: string | null;
  clientId: string | null;
  type: string;
  status: AppointmentStatus;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  duration: number; // minutes
  staffId: string | null;
  staffName: string | null;
  locationId: string | null;
  notes: string | null;
  intakeFormType: IntakeFormType;
  reminderSentAt: string | null;
  reminderPreference: 'email' | 'sms' | null;
  inventoryHoldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentType {
  id: string;
  name: { en: string; fr: string };
  durationMinutes: number;
  bufferMinutes: number;
  color: string; // hex
  locationId: string | null;
  active: boolean;
  onlineBookable: boolean;
  intakeFormType: IntakeFormType;
  price: number | null; // cents, null = free
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  locationId: string;
  role: string;
}

export interface InventoryHold {
  id: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantTitle: string | null;
  reason: 'try_on_hold';
  appointmentId: string | null;
  clientId: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface AppointmentListParams {
  date?: string; // YYYY-MM-DD (single day)
  from?: string; // YYYY-MM-DD (range start)
  to?: string; // YYYY-MM-DD (range end)
  locationId?: string;
  staffId?: string;
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
}

export interface AppointmentService {
  id: string;
  name: { en: string; fr: string };
  durationMinutes: number;
  bufferMinutes: number;
  locationId: string | null;
  active: boolean;
  sortOrder: number | null;
  createdAt: string;
  // Optional fields that may or may not be present depending on Foundry version
  color?: string;
  onlineBookable?: boolean;
  intakeFormType?: IntakeFormType;
  price?: number | null;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  locationId: string | null;
  avatarUrl: string | null;
}

export interface TimeSlot {
  startsAt: string;
  endsAt: string;
  staffId: string;
  locationId: string;
  available: boolean;
}

export interface CreateAppointmentPayload {
  title: string;
  shopifyCustomerId: string | null; // Foundry uses shopifyCustomerId, not clientId
  staffId: string | null;
  typeId: string | null;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  notes: string | null;
  locationId: string | null;
  source: 'tablet';
}

export interface UpdateAppointmentPayload {
  title?: string;
  staffId?: string | null;
  startsAt?: string;
  endsAt?: string;
  notes?: string | null;
}

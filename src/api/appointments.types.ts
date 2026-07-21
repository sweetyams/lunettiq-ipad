// Appointment status flow:
// scheduled → confirmed → in_progress → completed
//                                     → no_show
//          → cancelled

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
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

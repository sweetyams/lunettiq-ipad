export interface Appointment {
  id: string;
  clientName: string | null;
  clientId: string | null;
  type: string; // 'styling' | 'eye-exam' | 'second-sight' | 'pickup' | 'follow-up'
  status: string; // 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show'
  startsAt: string;
  endsAt: string;
  duration: number; // minutes
  staffId: string | null;
  locationId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AppointmentListParams {
  date?: string; // YYYY-MM-DD
  locationId?: string;
  staffId?: string;
}
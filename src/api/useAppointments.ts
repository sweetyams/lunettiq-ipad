import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { fetchAppointments, toInventoryHold, type FoundryProtectionRow } from './appointmentsMapping';
import {
  Appointment,
  AppointmentListParams,
  AppointmentStatusUpdate,
  AppointmentService,
  StaffMember,
  StaffSchedule,
  TimeSlot,
  InventoryHold,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from './appointments.types';

// --- Query helpers ---

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Queries ---

/** Fetch appointments with flexible params (date, range, filters) */
export function useAppointments(params?: AppointmentListParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => fetchAppointments(params),
    staleTime: 2 * 60 * 1000, // 2 min — appointments change frequently
  });
}

/** Today's appointments for the current location */
export function useTodayAppointments(locationId?: string) {
  const today = formatDate(new Date());
  const params: AppointmentListParams = { date: today, locationId };

  return useQuery({
    queryKey: ['appointments', 'today', locationId],
    queryFn: () => fetchAppointments(params),
    staleTime: 2 * 60 * 1000,
    // Refetch every 5 min to stay in sync
    refetchInterval: 5 * 60 * 1000,
  });
}

/** Week appointments for calendar view */
export function useWeekAppointments(weekStart: Date, locationId?: string) {
  const from = formatDate(weekStart);
  const to = formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
  const params: AppointmentListParams = { from, to, locationId };

  return useQuery({
    queryKey: ['appointments', 'week', from, locationId],
    queryFn: () => fetchAppointments(params),
    staleTime: 5 * 60 * 1000,
  });
}

/** A client's next booked visits (next 90 days), soonest first. */
export function useClientUpcoming(clientId: string) {
  const now = new Date();
  const from = formatDate(now);
  const to = formatDate(new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000));
  return useQuery({
    queryKey: ['appointments', 'client-upcoming', clientId, from],
    queryFn: async () => {
      const list = await fetchAppointments({ from, to, clientId });
      // Filter here too: the scheduling route may ignore clientId.
      return list
        .filter((a) => a.clientId === clientId && a.status !== 'cancelled' && a.status !== 'no_show' && Date.parse(a.endsAt) >= now.getTime())
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    },
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Staff schedules for a given date (who's working) */
export function useStaffSchedules(date: string, locationId?: string) {
  const params: Record<string, string> = { date };
  if (locationId) params.locationId = locationId;

  return useQuery({
    queryKey: ['staff-schedules', date, locationId],
    queryFn: () =>
      api.get<StaffSchedule[]>('/api/storefront/scheduling/staff', { params }),
    staleTime: 10 * 60 * 1000, // 10 min — staff schedules rarely change intraday
  });
}

/**
 * Try-on holds for an appointment: those referencing the appointment or its
 * client. Foundry's list ignores filters, so match here (never show another
 * client's holds).
 */
export function useAppointmentHolds(appointmentId: string | null, clientId?: string | null) {
  return useQuery({
    queryKey: ['inventory-holds', 'appointment', appointmentId, clientId ?? null, 'mapped'],
    queryFn: async () => {
      const rows = await api.get<FoundryProtectionRow[]>('/api/inventory/protections', {
        params: { reason: 'try_on_hold', appointmentId: appointmentId! },
      });
      return (Array.isArray(rows) ? rows : [])
        .map(toInventoryHold)
        .filter((h) => h.appointmentId === appointmentId || (!!clientId && h.clientId === clientId));
    },
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000,
  });
}

/** All active try-on holds (not scoped to a single appointment) */
export function useActiveHolds() {
  return useQuery({
    queryKey: ['inventory-holds', 'active', 'mapped'],
    queryFn: async () => {
      try {
        const rows = await api.get<FoundryProtectionRow[]>('/api/inventory/protections', {
          params: { reason: 'try_on_hold' },
        });
        return (Array.isArray(rows) ? rows : []).map(toInventoryHold);
      } catch (error) {
        // Gracefully handle 404 (module not enabled for this tenant)
        if (error instanceof Error && 'code' in error && (error as any).code === 'NOT_FOUND') {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 (module not enabled)
      if (error instanceof Error && 'code' in error && (error as any).code === 'NOT_FOUND') {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// --- Mutations ---

/** Update appointment status (check-in, complete, no-show) */
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentStatusUpdate }) =>
      api.post<Appointment>(`/api/scheduling/${id}/transition`, data),
    onSuccess: () => {
      // Invalidate all appointment queries to refetch fresh state
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Mark client as arrived (status → arrived) */
export function useMarkArrived() {
  const updateAppointment = useUpdateAppointment();

  return {
    ...updateAppointment,
    mutate: (appointmentId: string) =>
      updateAppointment.mutate({
        id: appointmentId,
        data: { status: 'arrived' },
      }),
    mutateAsync: (appointmentId: string) =>
      updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: 'arrived' },
      }),
  };
}

/** Start the appointment service (status → in_progress) */
export function useStartAppointment() {
  const updateAppointment = useUpdateAppointment();

  return {
    ...updateAppointment,
    mutate: (appointmentId: string) =>
      updateAppointment.mutate({
        id: appointmentId,
        data: { status: 'in_progress' },
      }),
    mutateAsync: (appointmentId: string) =>
      updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: 'in_progress' },
      }),
  };
}

/** @deprecated Use useMarkArrived + useStartAppointment instead */
export function useCheckIn() {
  return useMarkArrived();
}

/** Mark appointment as no-show */
export function useMarkNoShow() {
  const updateAppointment = useUpdateAppointment();

  return {
    ...updateAppointment,
    mutate: (appointmentId: string) =>
      updateAppointment.mutate({
        id: appointmentId,
        data: { status: 'no_show' },
      }),
    mutateAsync: (appointmentId: string) =>
      updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: 'no_show' },
      }),
  };
}

/** Available appointment services/types — from GET /api/scheduling/types */
export function useAppointmentServices() {
  return useQuery({
    queryKey: ['appointment-services'],
    queryFn: () => api.get<AppointmentService[]>('/api/scheduling/types'),
    staleTime: 30 * 60 * 1000, // 30 min — rarely changes
  });
}

/** Staff available for scheduling — from GET /api/staff */
export function useSchedulingStaff() {
  return useQuery({
    queryKey: ['scheduling-staff'],
    queryFn: () => api.get<StaffMember[]>('/api/staff'),
    staleTime: 10 * 60 * 1000,
  });
}

/** Available time slots for a date/type/staff combination */
export function useAvailableSlots(params: { date: string; typeId?: string; staffId?: string; locationId?: string }) {
  // Only fetch when we have a valid date (YYYY-MM-DD format)
  const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(params.date);

  return useQuery({
    queryKey: ['available-slots', params],
    queryFn: () => {
      const queryParams: Record<string, string> = { date: params.date };
      if (params.typeId) queryParams.typeId = params.typeId;
      if (params.staffId) queryParams.staffId = params.staffId;
      if (params.locationId) queryParams.locationId = params.locationId;
      return api.get<TimeSlot[]>('/api/scheduling/slots', { params: queryParams });
    },
    enabled: hasValidDate,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

/** Create a new appointment */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      api.post<Appointment>('/api/scheduling', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

/** Update appointment details (time, staff, notes) */
export function useUpdateAppointmentDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentPayload }) =>
      api.patch<Appointment>(`/api/scheduling/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

/** Cancel an appointment (transitions to cancelled) */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Appointment>(`/api/scheduling/${id}/transition`, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Complete an appointment */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Appointment>(`/api/scheduling/${id}/transition`, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Confirm a scheduled appointment */
export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Appointment>(`/api/scheduling/${id}/transition`, { status: 'confirmed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Manually trigger a reminder for an appointment */
export function useSendReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ sent: boolean; channel: string }>(`/api/scheduling/${id}/remind`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Client's appointment history */
export function useClientAppointments(clientId: string | null) {
  return useQuery({
    queryKey: ['appointments', 'client', clientId, 'scoped'],
    // The scheduling route may ignore clientId; never show other clients' visits.
    queryFn: async () => (await fetchAppointments({ clientId: clientId! }))
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

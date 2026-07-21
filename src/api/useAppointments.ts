import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import {
  Appointment,
  AppointmentListParams,
  AppointmentStatusUpdate,
  StaffSchedule,
  InventoryHold,
} from './appointments.types';

// --- Query helpers ---

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildParams(params?: AppointmentListParams): Record<string, string> | undefined {
  if (!params) return undefined;
  const result: Record<string, string> = {};
  if (params.date) result.date = params.date;
  if (params.from) result.from = params.from;
  if (params.to) result.to = params.to;
  if (params.locationId) result.locationId = params.locationId;
  if (params.staffId) result.staffId = params.staffId;
  return Object.keys(result).length > 0 ? result : undefined;
}

// --- Queries ---

/** Fetch appointments with flexible params (date, range, filters) */
export function useAppointments(params?: AppointmentListParams) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () =>
      api.get<Appointment[]>('/api/scheduling', {
        params: buildParams(params),
      }),
    staleTime: 2 * 60 * 1000, // 2 min — appointments change frequently
  });
}

/** Today's appointments for the current location */
export function useTodayAppointments(locationId?: string) {
  const today = formatDate(new Date());
  const params: AppointmentListParams = { date: today, locationId };

  return useQuery({
    queryKey: ['appointments', 'today', locationId],
    queryFn: () =>
      api.get<Appointment[]>('/api/scheduling', {
        params: buildParams(params),
      }),
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
    queryFn: () =>
      api.get<Appointment[]>('/api/scheduling', {
        params: buildParams(params),
      }),
    staleTime: 5 * 60 * 1000,
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

/** Inventory holds for an appointment (frames pulled for client) */
export function useAppointmentHolds(appointmentId: string | null) {
  return useQuery({
    queryKey: ['inventory-holds', appointmentId],
    queryFn: () =>
      api.get<InventoryHold[]>('/api/inventory/protections', {
        params: { reason: 'try_on_hold', appointmentId: appointmentId! },
      }),
    enabled: !!appointmentId,
    staleTime: 5 * 60 * 1000,
  });
}

/** All active try-on holds (not scoped to a single appointment) */
export function useActiveHolds() {
  return useQuery({
    queryKey: ['inventory-holds', 'active'],
    queryFn: async () => {
      try {
        return await api.get<InventoryHold[]>('/api/inventory/protections', {
          params: { reason: 'try_on_hold' },
        });
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
      api.patch<Appointment>(`/api/scheduling/${id}/transition`, data),
    onSuccess: () => {
      // Invalidate all appointment queries to refetch fresh state
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/** Check in a client (status → in_progress) */
export function useCheckIn() {
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

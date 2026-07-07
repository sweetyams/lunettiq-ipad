import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Appointment, AppointmentListParams } from './appointments.types';

export function useAppointments(params?: AppointmentListParams) {
  // Convert params to string record for API call
  const apiParams = params ? Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null)
  ) : undefined;

  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => api.get<Appointment[]>('/api/admin/appointments', { params: apiParams }),
    staleTime: 2 * 60 * 1000, // 2 minutes — appointments change frequently
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      api.patch<Appointment>(`/api/admin/appointments/${id}`, data),
    onSuccess: (updatedAppointment) => {
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Optionally update the specific appointment in cache
      queryClient.setQueryData(
        ['appointments', { id: updatedAppointment.id }],
        updatedAppointment
      );
    },
  });
}
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useMarkArrived, useStartAppointment, useMarkNoShow } from '@/src/api/useAppointments';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { toast } from '@/src/ui/useToastStore';
import type { Appointment } from '@/src/api/appointments.types';

/**
 * Appointment → visit actions shared by Floor and Schedule. Starting a visit
 * always goes through the session store (with the appointment id), so the
 * workspace opens on a real visit and Foundry links the two.
 */
export function useVisitActions() {
  const router = useRouter();
  const markArrived = useMarkArrived();
  const startAppointment = useStartAppointment();
  const markNoShow = useMarkNoShow();
  const { startSession, mode, activeClientId } = useSessionStore();

  const fail = (what: string) => () => toast.error(`Couldn’t ${what}`, 'Check the connection and try again.');

  const arrive = useCallback((a: Appointment) => {
    markArrived.mutateAsync(a.id).catch(fail('mark them arrived'));
  }, [markArrived]);

  const noShow = useCallback((a: Appointment) => {
    markNoShow.mutateAsync(a.id).catch(fail('mark the no-show'));
  }, [markNoShow]);

  /** Arrived (or in progress) → start or reopen the visit. */
  const startVisit = useCallback((a: Appointment) => {
    if (!a.clientId) {
      toast.warning('No client on this appointment', 'Edit the appointment to add the client first.');
      return;
    }
    if (mode !== 'idle' && activeClientId !== a.clientId) {
      toast.warning('Another visit is open', 'End it before starting a new one.');
      return;
    }
    if (a.status !== 'in_progress') startAppointment.mutateAsync(a.id).catch(fail('start the appointment'));
    if (mode === 'idle') startSession(a.clientId, a.clientName || 'Client', { appointmentId: a.id });
    router.push(`/clients/${a.clientId}/session`);
  }, [mode, activeClientId, startAppointment, startSession, router]);

  return { arrive, noShow, startVisit, busy: markArrived.isPending || startAppointment.isPending || markNoShow.isPending };
}

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { DoorOpen } from 'lucide-react-native';
import { useCreateAppointment, useMarkArrived } from '@/src/api/useAppointments';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { toast } from '@/src/ui/useToastStore';
import { Button, Sheet } from '@/src/ui/kit';
import { ClientSearch, clientName } from '@/src/features/clients/ClientSearch';
import type { Client } from '@/src/api/clients.types';

const nameOf = clientName;

/**
 * Walk-in: find the client, then one tap logs the walk-in, marks them
 * arrived and opens the visit. (Previously it created a client-less
 * appointment and sent staff to a Clients mode that didn't exist.)
 */
export function WalkInButton({ variant = 'secondary' }: { variant?: 'primary' | 'secondary' } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const create = useCreateAppointment();
  const arrive = useMarkArrived();
  const { startSession, mode } = useSessionStore();

  const start = async (c: Client) => {
    if (busy) return;
    if (mode !== 'idle') {
      toast.warning('Another visit is open', 'End it before starting a walk-in.');
      return;
    }
    setBusy(true);
    try {
      const now = new Date();
      const appt = await create.mutateAsync({
        title: 'Walk-in', customerId: c.id, shopifyCustomerId: c.id, staffId: null, typeId: null,
        startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 60 * 60_000).toISOString(),
        notes: null, locationId: null, source: 'tablet',
      });
      await arrive.mutateAsync(appt.id).catch(() => undefined);
      startSession(c.id, nameOf(c), { appointmentId: appt.id });
      setOpen(false);
      router.push(`/clients/${c.id}/session`);
    } catch {
      toast.error('Couldn’t start the walk-in', 'Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button label="Walk-in" icon={DoorOpen} variant={variant} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title="Walk-in" subtitle="Find them, then start the visit. It’s logged on today’s schedule." fill scroll={false}>
        <ClientSearch
          onPick={start}
          emptyHint="No match. New clients can’t be created from the iPad yet; add them in Foundry, then search again."
          trailing={(c) => <Button label="Start visit" size="sm" variant="primary" onPress={() => start(c)} disabled={busy} />}
        />
      </Sheet>
    </>
  );
}

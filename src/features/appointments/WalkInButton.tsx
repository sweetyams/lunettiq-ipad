import { useState } from 'react';
import { useRouter } from 'expo-router';
import { DoorOpen, UserPlus, UserRound } from 'lucide-react-native';
import { View } from 'react-native';
import { useQuickClient } from '@/src/features/clients/useQuickClient';
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Walk-in" icon={DoorOpen} variant={variant} onPress={() => setOpen(true)} />
      <WalkInSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** The walk-in picker on its own, so Floor's "Start a visit" tile can open it. */
export function WalkInSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const setOpen = (v: boolean) => { if (!v) onClose(); };
  const open = visible;
  const [busy, setBusy] = useState(false);
  const create = useCreateAppointment();
  const arrive = useMarkArrived();
  const { startSession, mode } = useSessionStore();
  const showQuickClient = useQuickClient((st) => st.show);
  const newClient = (anonymous: boolean) => {
    if (mode !== 'idle') {
      toast.warning('Another visit is open', 'End it before starting a walk-in.');
      return;
    }
    setOpen(false);
    showQuickClient({ startVisit: true, anonymous });
  };

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
      <Sheet visible={open} onClose={() => setOpen(false)} title="Walk-in" subtitle="Find them, add them, or start without details. Name and contact can come at the end." fill scroll={false}>
        <ClientSearch
          onPick={start}
          header={
            <View className="flex-row gap-[8px] pb-[12px]">
              <Button label="New client" icon={UserPlus} onPress={() => newClient(false)} />
              <Button label="Start without details" icon={UserRound} variant="ghost" onPress={() => newClient(true)} />
            </View>
          }
          emptyHint="No match. Add them as a new client, or start without details and take their name at the end."
          trailing={(c) => <Button label="Start visit" size="sm" variant="primary" onPress={() => start(c)} disabled={busy} />}
        />
      </Sheet>
    </>
  );
}

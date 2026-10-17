import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { DoorOpen } from 'lucide-react-native';
import { useCreateAppointment, useMarkArrived } from '@/src/api/useAppointments';
import { useClients } from '@/src/api/useClients';
import { useSessionStore } from '@/src/features/session/useSessionStore';
import { Avatar } from '@/src/ui/Avatar';
import { toast } from '@/src/ui/useToastStore';
import { Button, ListRow, Sheet, TextField } from '@/src/ui/kit';
import type { Client } from '@/src/api/clients.types';

const nameOf = (c: Client) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'No name yet';

/**
 * Walk-in: find the client, then one tap logs the walk-in, marks them
 * arrived and opens the visit. (Previously it created a client-less
 * appointment and sent staff to a Clients mode that didn't exist.)
 */
export function WalkInButton({ variant = 'secondary' }: { variant?: 'primary' | 'secondary' } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const create = useCreateAppointment();
  const arrive = useMarkArrived();
  const { startSession, mode } = useSessionStore();
  const { data, isFetching } = useClients(query.trim().length >= 2 ? { q: query.trim(), limit: 8 } : { limit: 0 });
  const results = query.trim().length >= 2 ? data?.clients ?? [] : [];

  const start = async (c: Client) => {
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
      setQuery('');
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
      <Sheet visible={open} onClose={() => setOpen(false)} title="Walk-in" subtitle="Find them, then start the visit. It’s logged on today’s schedule.">
        <View className="gap-[12px]">
          <TextField label="Client" value={query} onChangeText={setQuery} placeholder="Name or email" autoCapitalize="none" autoCorrect={false} autoFocus />
          {query.trim().length >= 2 ? (
            <View className="border border-border rounded-md overflow-hidden">
              {results.length === 0 ? (
                <Text className="text-body-sm text-text-tertiary px-[16px] py-[14px]">
                  {isFetching ? 'Searching…' : 'No match. New clients can’t be created from the iPad yet; add them in Foundry, then search again.'}
                </Text>
              ) : results.map((c, i) => (
                <ListRow key={c.id} divider={i > 0}
                  leading={<Avatar size="sm" firstName={c.firstName ?? ''} lastName={c.lastName ?? ''} />}
                  title={nameOf(c)} subtitle={c.email ?? undefined}
                  trailing={<Button label="Start visit" size="sm" variant="primary" onPress={() => start(c)} disabled={busy} />} />
              ))}
            </View>
          ) : null}
        </View>
      </Sheet>
    </>
  );
}

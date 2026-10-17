import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateAppointment, useAppointmentServices, useSchedulingStaff, useAvailableSlots } from '@/src/api/useAppointments';
import { useClient, useClients } from '@/src/api/useClients';
import type { AppointmentService, CreateAppointmentPayload, TimeSlot } from '@/src/api/appointments.types';
import type { Client } from '@/src/api/clients.types';
import { Avatar } from '@/src/ui/Avatar';
import { toast } from '@/src/ui/useToastStore';
import { Sheet, Field, TextField, ChoiceChips, ListRow, Button, kitColors , staffFirstName } from '@/src/ui/kit';

interface CreateAppointmentSheetProps {
  visible: boolean;
  onClose: () => void;
  preselectedClientId?: string | null;
  preselectedDate?: string | null; // YYYY-MM-DD
  preselectedServiceType?: 'follow-up' | 'pickup' | null;
  followUpContext?: { previousSessionId?: string; suggestedNotes?: string } | null;
}

function serviceName(name: AppointmentService['name'] | string | unknown): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object' && 'en' in name) return (name as { en: string }).en;
  return 'Appointment';
}
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hm = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
const nameOf = (c: Pick<Client, 'firstName' | 'lastName' | 'email'>) => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'No name yet';

/** Book an appointment on one page: service, client, with whom, day, time, notes. */
export function CreateAppointmentSheet({
  visible, onClose, preselectedClientId = null, preselectedDate = null, preselectedServiceType = null, followUpContext = null,
}: CreateAppointmentSheetProps) {
  const initialDate = () => {
    if (preselectedDate) return new Date(`${preselectedDate}T12:00:00`);
    const d = new Date();
    if (preselectedServiceType) d.setDate(d.getDate() + 14);
    return d;
  };
  const [service, setService] = useState<AppointmentService | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(initialDate);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState(followUpContext?.suggestedNotes ?? '');
  const [query, setQuery] = useState('');

  const { data: services } = useAppointmentServices();
  const { data: staffList } = useSchedulingStaff();
  const { data: preselected } = useClient(preselectedClientId ?? '');
  const { data: found, isFetching: searching } = useClients(query.trim().length >= 2 ? { q: query.trim(), limit: 6 } : { limit: 0 });
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots({ date: service ? ymd(date) : '', typeId: service?.id, staffId: staffId ?? undefined });
  const create = useCreateAppointment();

  // The client we were opened for (profile, end of visit).
  useEffect(() => {
    if (preselected && !client) setClient(preselected);
  }, [preselected, client]);

  // Follow-up / pickup bookings pick the matching service.
  useEffect(() => {
    if (!preselectedServiceType || service || !services?.length) return;
    const match = services.find((s) => serviceName(s.name).toLowerCase().includes(preselectedServiceType.replace('-', '')) || serviceName(s.name).toLowerCase().includes(preselectedServiceType));
    if (match) setService(match);
  }, [preselectedServiceType, services, service]);

  // One chip per start time; "Anyone" takes the first free staff member.
  const times = useMemo(() => {
    const byStart = new Map<string, TimeSlot>();
    for (const s of slots ?? []) if (s.available && !byStart.has(s.startsAt) && Date.parse(s.startsAt) > Date.now()) byStart.set(s.startsAt, s);
    return [...byStart.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [slots]);

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const dayKey = ymd(date);

  const submit = () => {
    if (!service || !slot) return;
    const payload: CreateAppointmentPayload = {
      title: serviceName(service.name),
      customerId: client?.id ?? null,
      shopifyCustomerId: client?.id ?? null,
      staffId: staffId ?? slot.staffId ?? null,
      typeId: service.id,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      notes: notes.trim() || null,
      locationId: slot.locationId ?? null,
      source: 'tablet',
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Booked', client?.email ? `Confirmation sent to ${client.email}` : client ? 'No email on file. Confirm with them directly.' : undefined);
        onClose();
      },
      onError: () => toast.error('Couldn’t book', 'That time may have just been taken. Pick another and try again.'),
    });
  };

  const staffName = staffList?.find((s) => s.id === (staffId ?? slot?.staffId))?.name;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title="Book appointment"
      subtitle={slot && service ? `${serviceName(service.name)} · ${date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })} at ${hm(slot.startsAt)}${staffName ? ` with ${staffName}` : ''}` : 'Pick a service, then a time.'}
      primary={{ label: 'Book', onPress: submit, disabled: !service || !slot, loading: create.isPending }}
    >
      <View className="gap-[24px]">
        <Field label="Service" required>
          <ChoiceChips
            options={(services ?? []).filter((s) => s.active !== false).map((s) => ({ key: s.id, label: `${serviceName(s.name)} · ${s.durationMinutes} min` }))}
            value={service?.id ?? null}
            onChange={(id: string | null) => { setService(services?.find((s) => s.id === id) ?? null); setSlot(null); }}
          />
        </Field>

        <Field label="Client" hint={client ? undefined : 'Optional for a quick hold, but add them so they get a confirmation.'}>
          {client ? (
            <View className="border border-border rounded-md">
              <ListRow
                divider={false}
                leading={<Avatar size="sm" firstName={client.firstName ?? ''} lastName={client.lastName ?? ''} />}
                title={nameOf(client)}
                subtitle={client.email ?? undefined}
                trailing={preselectedClientId ? undefined : <Button label="Change" size="sm" variant="ghost" onPress={() => setClient(null)} />}
              />
            </View>
          ) : (
            <View className="gap-[8px]">
              <TextField label="Find a client" value={query} onChangeText={setQuery} placeholder="Name or email" autoCapitalize="none" autoCorrect={false} />
              {query.trim().length >= 2 ? (
                <View className="border border-border rounded-md overflow-hidden">
                  {(found?.clients ?? []).length === 0 ? (
                    <Text className="text-body-sm text-text-tertiary px-[16px] py-[14px]">{searching ? 'Searching…' : 'No matching clients.'}</Text>
                  ) : (
                    (found?.clients ?? []).map((c, i) => (
                      <ListRow key={c.id} divider={i > 0} onPress={() => { setClient(c); setQuery(''); }}
                        leading={<Avatar size="sm" firstName={c.firstName ?? ''} lastName={c.lastName ?? ''} />}
                        title={nameOf(c)} subtitle={c.email ?? undefined} />
                    ))
                  )}
                </View>
              ) : null}
            </View>
          )}
        </Field>

        {staffList?.length ? (
          <Field label="With">
            <ChoiceChips
              options={[{ key: 'any', label: 'Anyone available' }, ...staffList.map((s) => ({ key: s.id, label: s.name.includes('@') ? staffFirstName(s.name) : s.name }))]}
              value={staffId ?? 'any'}
              onChange={(k: string | null) => { setStaffId(!k || k === 'any' ? null : k); setSlot(null); }}
            />
          </Field>
        ) : null}

        <Field label="Day">
          <View className="flex-row items-center gap-[8px]">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="flex-1">
              {days.map((d, i) => {
                const on = ymd(d) === dayKey;
                return (
                  <Pressable key={ymd(d)} onPress={() => { setDate(d); setSlot(null); }} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                    <View className={`w-[64px] h-[64px] rounded-md border items-center justify-center ${on ? 'bg-accent border-accent' : 'bg-bg-page border-border'}`}>
                      <Text className={`text-body-sm ${on ? 'text-accent-text' : 'text-text-tertiary'}`}>{i === 0 ? 'Today' : d.toLocaleDateString('en-CA', { weekday: 'short' })}</Text>
                      <Text className={`text-heading-lg ${on ? 'text-accent-text' : 'text-text-primary'}`}>{d.getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <DateTimePicker value={date} mode="date" display="compact" minimumDate={new Date()} onChange={(_e, d) => { if (d) { setDate(d); setSlot(null); } }} accentColor={kitColors.primary} />
          </View>
        </Field>

        <Field label="Time" required hint={!service ? 'Pick a service first.' : undefined}>
          {service ? (
            slotsLoading ? (
              <Text className="text-body-sm text-text-tertiary">Finding free times…</Text>
            ) : times.length === 0 ? (
              <Text className="text-body-sm text-text-tertiary">Nothing free that day. Try another day{staffId ? ' or “Anyone available”' : ''}.</Text>
            ) : (
              <ChoiceChips
                options={times.map((t) => ({ key: t.startsAt, label: hm(t.startsAt) }))}
                value={slot?.startsAt ?? null}
                onChange={(k: string | null) => setSlot(times.find((t) => t.startsAt === k) ?? null)}
              />
            )
          ) : null}
        </Field>

        <TextField label="Notes" hint="Staff only." value={notes} onChangeText={setNotes} placeholder="e.g. Bring current glasses; wants sunglasses too" multiline />
      </View>
    </Sheet>
  );
}

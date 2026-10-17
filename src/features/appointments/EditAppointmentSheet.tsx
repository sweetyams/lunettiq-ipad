import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import type { Appointment, TimeSlot, UpdateAppointmentPayload } from '@/src/api/appointments.types';
import { useUpdateAppointmentDetails, useSchedulingStaff, useAvailableSlots } from '@/src/api/useAppointments';
import { toast } from '@/src/ui/useToastStore';
import { Sheet, Field, TextField, ChoiceChips , staffFirstName } from '@/src/ui/kit';

interface EditAppointmentSheetProps {
  visible: boolean;
  appointment: Appointment;
  onClose: () => void;
  onSaved: () => void;
}

// Local calendar date (toISOString() is UTC and shifts evening visits to tomorrow).
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hm = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });

/** Reschedule, reassign, or update notes. */
export function EditAppointmentSheet({ visible, appointment: a, onClose, onSaved }: EditAppointmentSheetProps) {
  const [staffId, setStaffId] = useState<string | null>(a.staffId);
  const [date, setDate] = useState<Date>(() => new Date(a.startsAt));
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState(a.notes ?? '');
  const { data: staff } = useSchedulingStaff();
  const { data: slots, isLoading } = useAvailableSlots({ date: a.typeId ? ymd(date) : '', typeId: a.typeId ?? undefined, staffId: staffId ?? undefined });
  const update = useUpdateAppointmentDetails();

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const times = useMemo(() => {
    const m = new Map<string, TimeSlot>();
    for (const s of slots ?? []) if (s.available && !m.has(s.startsAt) && Date.parse(s.startsAt) > Date.now()) m.set(s.startsAt, s);
    return [...m.values()].sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt));
  }, [slots]);

  const changes: UpdateAppointmentPayload = {};
  if (staffId !== a.staffId) changes.staffId = staffId;
  if (slot) { changes.startsAt = slot.startsAt; changes.endsAt = slot.endsAt; }
  if (notes !== (a.notes ?? '')) changes.notes = notes.trim() || null;
  const dirty = Object.keys(changes).length > 0;

  const save = () => update.mutate({ id: a.id, data: changes }, {
    onSuccess: () => { toast.success('Appointment updated'); onSaved(); onClose(); },
    onError: () => toast.error('Couldn’t update', 'That time may have just been taken. Try another.'),
  });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      wide
      title={`Edit · ${a.clientName ?? a.type}`}
      subtitle={`${a.type} · now ${new Date(a.startsAt).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`}
      primary={{ label: 'Save changes', onPress: save, disabled: !dirty, loading: update.isPending }}
    >
      <View className="gap-[24px]">
        {staff?.length ? (
          <Field label="With">
            <ChoiceChips options={[{ key: 'none', label: 'Unassigned' }, ...staff.map((s) => ({ key: s.id, label: s.name.includes('@') ? staffFirstName(s.name) : s.name }))]} value={staffId ?? 'none'}
              onChange={(k: string | null) => { setStaffId(!k || k === 'none' ? null : k); setSlot(null); }} />
          </Field>
        ) : null}
        <Field label="New day">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => {
              const on = ymd(d) === ymd(date);
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
        </Field>
        <Field label="New time" hint={slot ? undefined : 'Leave unselected to keep the current time.'}>
          {!a.typeId ? (
            <Text className="text-body-sm text-text-tertiary">This appointment has no service on file, so free times can’t be checked. Cancel and book it again to move it.</Text>
          ) : isLoading ? (
            <Text className="text-body-sm text-text-tertiary">Finding free times…</Text>
          ) : times.length === 0 ? (
            <Text className="text-body-sm text-text-tertiary">Nothing free that day.</Text>
          ) : (
            <ChoiceChips options={times.map((t) => ({ key: t.startsAt, label: hm(t.startsAt) }))} value={slot?.startsAt ?? null}
              onChange={(k: string | null) => setSlot(times.find((t) => t.startsAt === k) ?? null)} />
          )}
        </Field>
        <TextField label="Notes" hint="Staff only." value={notes} onChangeText={setNotes} multiline />
      </View>
    </Sheet>
  );
}

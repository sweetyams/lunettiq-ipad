import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppointments, useStaffSchedules, useSchedulingStaff, useStaffRoster } from '@/src/api/useAppointments';
import type { Appointment } from '@/src/api/appointments.types';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { Badge, Button, FilterChips, PageHeader, StatusDot, elevation, staffFirstName } from '@/src/ui/kit';
import { APPOINTMENT_STATUS } from '@/src/features/appointments/AppointmentDetailPanel';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const hm = (iso: string) => new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
const hhmm = (t: string) => { const [h = 0, m = 0] = t.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }); };

/** Who's on today and what each person has booked, one column each. */
export default function StaffScheduleScreen() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date());
  const key = ymd(date);
  const { data: staff } = useSchedulingStaff();
  const { data: schedules } = useStaffSchedules(key);
  const { data: appts, isLoading, error, refetch } = useAppointments({ date: key });
  // Prefer Foundry's daily roster (real shifts, day-offs, notes); older servers → schedule rows.
  const { data: roster } = useStaffRoster(key);

  const columns = useMemo(() => {
    const byStaff = new Map<string, Appointment[]>();
    for (const a of appts ?? []) {
      const k = a.staffId ?? 'unassigned';
      byStaff.set(k, [...(byStaff.get(k) ?? []), a]);
    }
    for (const l of byStaff.values()) l.sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt));
    if (roster) {
      const fmt = (r: (typeof roster)[number]) =>
        r.status === 'working' ? r.shifts.map((x) => `${hhmm(x.startTime)}–${hhmm(x.endTime)}`).join(', ') : null;
      const cols = roster.map((r) => ({
        id: r.staffId,
        name: r.name,
        role: r.title ?? '',
        hours: fmt(r),
        list: [...(byStaff.get(r.staffId) ?? []), ...(r.clerkUserId ? byStaff.get(r.clerkUserId) ?? [] : [])]
          .sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt)),
      }));
      const known = new Set(roster.flatMap((r) => [r.staffId, r.clerkUserId].filter(Boolean) as string[]));
      const unassigned = [...byStaff.entries()].filter(([k]) => !known.has(k)).flatMap(([, l]) => l);
      return unassigned.length ? [...cols, { id: 'unassigned', name: 'Unassigned', role: '', hours: null, list: unassigned }] : cols;
    }
    const cols = (staff ?? []).map((s) => {
      // Foundry's list is "staff with a schedule" (rows may be people or shifts).
      const shift = (schedules ?? []).find((sc) => sc.staffId === s.id || sc.id === s.id);
      const hours = shift?.startTime && shift?.endTime ? `${hhmm(shift.startTime)}–${hhmm(shift.endTime)}` : shift ? 'Scheduled' : null;
      return { id: s.id, name: s.name, role: s.role, hours, list: byStaff.get(s.id) ?? [] };
    }).sort((a, b) => Number(!!b.hours) - Number(!!a.hours) || b.list.length - a.list.length);
    const unassigned = byStaff.get('unassigned') ?? [];
    return unassigned.length ? [...cols, { id: 'unassigned', name: 'Unassigned', role: '', hours: null, list: unassigned }] : cols;
  }, [staff, schedules, appts, roster]);

  const onDuty = columns.filter((c) => c.hours).length;
  // No schedules at all = hours not set up in Foundry; don't call everyone "Off".
  const hasRoster = roster ? roster.some((r) => r.status !== 'unset') : (schedules ?? []).length > 0;
  const isToday = key === ymd(new Date());

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={isToday ? 'Staff today' : date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
        subtitle={`${hasRoster ? `${onDuty} on duty` : 'Working hours not set up in Foundry'} · ${(appts ?? []).length} appointments`}
        actions={
          <>
            <Button label="Previous day" icon={ChevronLeft} variant="ghost" onPress={() => setDate((d) => addDays(d, -1))} />
            {!isToday ? <Button label="Today" onPress={() => setDate(new Date())} /> : null}
            <Button label="Next day" icon={ChevronRight} variant="ghost" onPress={() => setDate((d) => addDays(d, 1))} />
          </>
        }
      />
      <View className="px-[32px] pt-[16px]">
        <FilterChips<'today' | 'week' | 'staff'>
          value="staff"
          onChange={(v) => { if (v === 'today') router.replace('/appointments'); if (v === 'week') router.replace('/appointments/week'); }}
          options={[{ key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'staff', label: 'Staff' }]}
        />
      </View>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : (
        <ScrollView horizontal contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 16 }}>
          {columns.map((c) => (
            <View key={c.id} className="w-[300px] gap-[10px]">
              <View className="flex-row items-center gap-[8px] px-[4px]">
                {hasRoster && c.id !== 'unassigned' ? <StatusDot tone={c.hours ? 'success' : 'muted'} /> : null}
                <Text className="text-body-md font-medium text-text-primary flex-1" numberOfLines={1}>{c.name.includes('@') ? staffFirstName(c.name) : c.name}</Text>
                <Text className="text-body-sm text-text-tertiary">{hasRoster && c.id !== 'unassigned' ? c.hours ?? 'Off' : `${c.list.length || ''}`}</Text>
              </View>
              <ScrollView contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                {c.list.length === 0 ? (
                  <Text className="text-body-sm text-text-dim px-[4px]">Nothing booked</Text>
                ) : c.list.map((a) => {
                  const s = APPOINTMENT_STATUS[a.status] ?? APPOINTMENT_STATUS.scheduled!;
                  return (
                    <Pressable key={a.id} onPress={() => router.push(`/appointments/week?date=${key}&selected=${a.id}`)} accessibilityRole="button"
                      accessibilityLabel={`${hm(a.startsAt)}, ${a.clientName ?? 'client'}, ${a.type}, ${s.label}`}>
                      {({ pressed }) => (
                        <View className={`border border-border rounded-md p-[14px] gap-[6px] ${pressed ? 'bg-bg-subtle' : 'bg-bg-page'}`} style={elevation.raised}>
                          <View className="flex-row items-center justify-between gap-[8px]">
                            <Text className="text-body-sm text-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>{hm(a.startsAt)}–{hm(a.endsAt)}</Text>
                            <Badge tone={s.tone}>{s.label}</Badge>
                          </View>
                          <Text className="text-body-md font-medium text-text-primary" numberOfLines={1}>{a.clientName ?? 'No client yet'}</Text>
                          <Text className="text-body-sm text-text-tertiary" numberOfLines={1}>{a.type}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

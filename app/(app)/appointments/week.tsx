import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarPlus } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWeekAppointments, useSchedulingStaff } from '@/src/api/useAppointments';
import type { Appointment } from '@/src/api/appointments.types';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Button, FilterChips, PageHeader, Section, kitColors } from '@/src/ui/kit';
import { AppointmentRow } from '@/src/features/floor/AppointmentRow';
import { AppointmentDetailPanel, CreateAppointmentSheet, EditAppointmentSheet } from '@/src/features/appointments';
import { useVisitActions } from '@/src/features/appointments/useVisitActions';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
function weekStartOf(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

/** Week: day strip with counts, the chosen day's list, and the appointment inspector. */
export default function WeekScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; selected?: string }>();
  const initial = params.date ? new Date(`${params.date}T12:00:00`) : new Date();
  const [weekStart, setWeekStart] = useState(() => weekStartOf(initial));
  const [day, setDay] = useState(() => ymd(initial));
  const [selectedId, setSelectedId] = useState<string | null>(params.selected ?? null);
  const [booking, setBooking] = useState<{ clientId: string | null; serviceType?: 'follow-up' } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!params.date) return;
    const d = new Date(`${params.date}T12:00:00`);
    setWeekStart(weekStartOf(d));
    setDay(params.date);
    if (params.selected) setSelectedId(params.selected);
  }, [params.date, params.selected]);

  const { data, isLoading, error, refetch, isRefetching } = useWeekAppointments(weekStart);
  const { data: staff } = useSchedulingStaff();
  const { arrive, startVisit } = useVisitActions();
  const staffName = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s.name])), [staff]);

  // Group by the LOCAL day (startsAt is UTC; slicing it moves evening visits).
  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const a of data ?? []) {
      const k = ymd(new Date(a.startsAt));
      const withStaff = { ...a, staffName: a.staffName ?? (a.staffId ? staffName.get(a.staffId) ?? null : null) };
      m.set(k, [...(m.get(k) ?? []), withStaff]);
    }
    for (const list of m.values()) list.sort((x, y) => Date.parse(x.startsAt) - Date.parse(y.startsAt));
    return m;
  }, [data, staffName]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const list = byDay.get(day) ?? [];
  const selected = list.find((a) => a.id === selectedId) ?? null;
  const todayKey = ymd(new Date());
  const total = [...byDay.values()].reduce((n, l) => n + l.length, 0);
  const title = `Week of ${weekStart.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })}`;

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={title}
        subtitle={`${total} appointments this week`}
        actions={
          <>
            <Button label="Previous" icon={ChevronLeft} variant="ghost" onPress={() => setWeekStart((w) => addDays(w, -7))} accessibilityLabel="Previous week" />
            <Button label="This week" onPress={() => { setWeekStart(weekStartOf(new Date())); setDay(todayKey); }} />
            <Button label="Next" icon={ChevronRight} variant="ghost" onPress={() => setWeekStart((w) => addDays(w, 7))} accessibilityLabel="Next week" />
            <Button label="Book" icon={CalendarPlus} variant="primary" onPress={() => setBooking({ clientId: null })} />
          </>
        }
      />
      <View className="px-[32px] pt-[16px] gap-[16px]">
        <FilterChips<'today' | 'week' | 'staff'>
          value="week"
          onChange={(v) => { if (v === 'today') router.replace('/appointments'); if (v === 'staff') router.replace('/appointments/staff-schedule'); }}
          options={[{ key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'staff', label: 'Staff' }]}
        />
        <View className="flex-row gap-[8px]">
          {days.map((d) => {
            const k = ymd(d);
            const on = k === day;
            const count = byDay.get(k)?.length ?? 0;
            return (
              <Pressable key={k} onPress={() => { setDay(k); setSelectedId(null); }} className="flex-1" accessibilityRole="tab" accessibilityState={{ selected: on }}
                accessibilityLabel={`${d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}, ${count} appointments`}>
                <View className={`items-center rounded-md border py-[10px] ${on ? 'bg-accent border-accent' : 'bg-bg-page border-border'}`}>
                  <Text className={`text-body-sm ${on ? 'text-accent-text' : k === todayKey ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                    {k === todayKey ? 'Today' : d.toLocaleDateString('en-CA', { weekday: 'short' })}
                  </Text>
                  <Text className={`text-heading-lg ${on ? 'text-accent-text' : 'text-text-primary'}`}>{d.getDate()}</Text>
                  <Text className={`text-body-sm ${on ? 'text-accent-text' : 'text-text-tertiary'}`}>{count ? `${count} booked` : '—'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 flex-row mt-[8px]">
        <ScrollView className="w-[640px] flex-grow-0" contentContainerStyle={{ padding: 24, paddingRight: 12, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={refetch} /> : list.length === 0 ? (
            <EmptyState message="Nothing booked this day." />
          ) : (
            <Section padded={false}>
              {list.map((a, i) => (
                <AppointmentRow key={a.id} appointment={a} first={i === 0} selected={a.id === selectedId}
                  hideAction={day !== todayKey}
                  onPress={() => setSelectedId(a.id)}
                  onMarkArrived={() => arrive(a)} onStartVisit={() => startVisit(a)} onOpenVisit={() => startVisit(a)} />
              ))}
            </Section>
          )}
        </ScrollView>
        <View className="flex-1 border-l border-border">
          {selected ? (
            <AppointmentDetailPanel appointment={selected} onEdit={() => setEditing(true)} onCancelled={() => setSelectedId(null)}
              onBookFollowUp={() => setBooking({ clientId: selected.clientId, serviceType: 'follow-up' })} />
          ) : (
            <View className="flex-1 items-center justify-center gap-[12px]">
              <CalendarDays size={32} color={kitColors.iconMuted} />
              <Text className="text-body-md text-text-tertiary">Select an appointment to see details.</Text>
            </View>
          )}
        </View>
      </View>

      {booking ? (
        <CreateAppointmentSheet visible onClose={() => setBooking(null)} preselectedClientId={booking.clientId}
          preselectedServiceType={booking.serviceType ?? null} preselectedDate={day >= todayKey ? day : null} />
      ) : null}
      {selected && editing ? <EditAppointmentSheet visible appointment={selected} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} /> : null}
    </View>
  );
}

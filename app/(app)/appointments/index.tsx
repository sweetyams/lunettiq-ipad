import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { CalendarPlus, CalendarDays } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTodayAppointments, useSchedulingStaff } from '@/src/api/useAppointments';
import { useOfflineAppointments } from '@/src/sync/useOfflineFallback';
import type { Appointment } from '@/src/api/appointments.types';
import { LoadingState } from '@/src/ui/LoadingState';
import { ErrorState } from '@/src/ui/ErrorState';
import { EmptyState } from '@/src/ui/EmptyState';
import { Badge, Button, FilterChips, PageHeader, Section, Sheet, kitColors, staffFirstName } from '@/src/ui/kit';
import { useLayout } from '@/src/ui/layout';
import { useT } from '@/src/i18n';
import { AppointmentRow } from '@/src/features/floor/AppointmentRow';
import { AppointmentDetailPanel, CreateAppointmentSheet, EditAppointmentSheet, WalkInButton } from '@/src/features/appointments';
import { useVisitActions } from '@/src/features/appointments/useVisitActions';

type View_ = 'today' | 'week' | 'staff';
const ORDER: Record<string, number> = { in_progress: 0, arrived: 1, confirmed: 2, scheduled: 2, completed: 3, no_show: 3, cancelled: 4 };

export default function ScheduleScreen() {
  const router = useRouter();
  const { selected, book } = useLocalSearchParams<{ selected?: string; book?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(selected ?? null);
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [booking, setBooking] = useState<{ clientId: string | null; serviceType?: 'follow-up' } | null>(book ? { clientId: book } : null);
  const [editing, setEditing] = useState(false);
  const layout = useLayout();
  const tr = useT();
  // Portrait 11": the list takes the width; details open as a sheet.
  const twoPane = layout.twoPane;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const { data: appointments, isLoading, error, refetch, isRefetching } = useTodayAppointments();
  const { data: offline } = useOfflineAppointments(todayKey);
  const { data: staff } = useSchedulingStaff();
  const { arrive, startVisit } = useVisitActions();

  // Deep links: Floor rows (?selected=) and profile "Book" (?book=clientId).
  useEffect(() => { if (selected) setSelectedId(selected); }, [selected]);
  useEffect(() => { if (book) setBooking({ clientId: book }); }, [book]);

  const staffName = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s.name])), [staff]);
  const all: Appointment[] = useMemo(
    () => (appointments ?? (offline as unknown as Appointment[]) ?? []).map((a) => ({ ...a, staffName: a.staffName ?? (a.staffId ? staffName.get(a.staffId) ?? null : null) })),
    [appointments, offline, staffName],
  );
  const usingCache = !appointments && !!offline;
  const list = useMemo(
    () => all
      .filter((a) => staffFilter === 'all' || a.staffId === staffFilter)
      .sort((a, b) => (ORDER[a.status] ?? 2) - (ORDER[b.status] ?? 2) || Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    [all, staffFilter],
  );
  const selectedAppt = list.find((a) => a.id === selectedId) ?? all.find((a) => a.id === selectedId) ?? null;

  const active = all.filter((a) => a.status === 'in_progress' || a.status === 'arrived').length;
  const upcoming = all.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;
  const subtitle = `${today.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })} · ${all.length} appointments${active ? ` · ${active} here now` : ''}${upcoming ? ` · ${upcoming} to come` : ''}`;

  return (
    <View className="flex-1 bg-bg-page">
      <PageHeader
        title={tr('schedule.title')}
        subtitle={subtitle}
        meta={usingCache ? <Badge tone="warning" dot>{tr('schedule.offlineCopy')}</Badge> : undefined}
        actions={
          <>
            <WalkInButton />
            <Button label={tr('schedule.book')} icon={CalendarPlus} variant="primary" onPress={() => setBooking({ clientId: null })} />
          </>
        }
      />
      <View className="flex-row items-center gap-[16px] px-[32px] pt-[16px]">
        <FilterChips<View_>
          value="today"
          onChange={(v) => { if (v === 'week') router.push('/appointments/week'); if (v === 'staff') router.push('/appointments/staff-schedule'); }}
          options={[{ key: 'today', label: tr('schedule.today') }, { key: 'week', label: tr('schedule.week') }, { key: 'staff', label: tr('schedule.staff') }]}
        />
        {staff && staff.length > 1 ? (
          <View className="flex-1">
            <FilterChips<string>
              value={staffFilter}
              onChange={setStaffFilter}
              options={[{ key: 'all', label: tr('schedule.everyone') }, ...staff.map((s) => {
                const first = staffFirstName(s.name);
                const clash = staff.filter((o) => staffFirstName(o.name) === first).length > 1;
                return { key: s.id, label: clash ? (s.name.includes('@') ? s.name.split('@')[0]! : s.name) : first };
              })]}
            />
          </View>
        ) : null}
      </View>

      <View className="flex-1 flex-row">
        <ScrollView
          className={twoPane ? 'flex-grow-0' : 'flex-1'}
          style={twoPane ? { width: layout.size === 'wide' ? 640 : 480 } : undefined}
          contentContainerStyle={{ padding: 24, paddingRight: 12, paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {isLoading ? <LoadingState /> : error && !usingCache ? <ErrorState error={error} onRetry={refetch} /> : list.length === 0 ? (
            <EmptyState message={staffFilter === 'all' ? tr('schedule.nothingToday') : tr('schedule.nothingForThem')} />
          ) : (
            <Section padded={false}>
              {list.map((a, i) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  first={i === 0}
                  selected={a.id === selectedId}
                  onPress={() => setSelectedId(a.id)}
                  onMarkArrived={() => arrive(a)}
                  onStartVisit={() => startVisit(a)}
                  onOpenVisit={() => startVisit(a)}
                />
              ))}
            </Section>
          )}
        </ScrollView>

        {twoPane ? (
          <View className="flex-1 border-l border-border">
            {selectedAppt ? (
              <AppointmentDetailPanel
                appointment={selectedAppt}
                onEdit={() => setEditing(true)}
                onCancelled={() => setSelectedId(null)}
                onBookFollowUp={() => setBooking({ clientId: selectedAppt.clientId, serviceType: 'follow-up' })}
              />
            ) : (
              <View className="flex-1 items-center justify-center gap-[12px]">
                <CalendarDays size={32} color={kitColors.iconMuted} />
                <Text className="text-body-md text-text-tertiary">{tr('schedule.selectAppointment')}</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {!twoPane && selectedAppt ? (
        <Sheet visible={!editing && !booking} onClose={() => setSelectedId(null)} title={tr('schedule.appointment')} fill scroll={false}>
          <AppointmentDetailPanel
            appointment={selectedAppt}
            onEdit={() => setEditing(true)}
            onCancelled={() => setSelectedId(null)}
            onBookFollowUp={() => setBooking({ clientId: selectedAppt.clientId, serviceType: 'follow-up' })}
          />
        </Sheet>
      ) : null}
      {booking ? (
        <CreateAppointmentSheet
          visible
          onClose={() => setBooking(null)}
          preselectedClientId={booking.clientId}
          preselectedServiceType={booking.serviceType ?? null}
        />
      ) : null}
      {selectedAppt && editing ? (
        <EditAppointmentSheet visible appointment={selectedAppt} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
      ) : null}
    </View>
  );
}

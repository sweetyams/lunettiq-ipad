import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Platform } from 'react-native';
import { X, Check, User, Clock, Calendar as CalendarIcon, Search } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  useCreateAppointment,
  useAppointmentServices,
  useSchedulingStaff,
  useAvailableSlots,
} from '@/src/api/useAppointments';
import { useClients } from '@/src/api/useClients';
import type {
  AppointmentService,
  StaffMember,
  TimeSlot,
  CreateAppointmentPayload,
} from '@/src/api/appointments.types';
import type { Client } from '@/src/api/clients.types';
import { Button, LoadingState } from '@/src/ui';
import { toast } from '@/src/ui/useToastStore';

interface CreateAppointmentSheetProps {
  visible: boolean;
  onClose: () => void;
  preselectedClientId?: string | null;
  preselectedDate?: string | null; // YYYY-MM-DD
  // NEW:
  preselectedServiceType?: 'follow-up' | 'pickup' | null;
  followUpContext?: {
    previousSessionId?: string;
    suggestedNotes?: string;
  } | null;
}

type Step = 'service' | 'client' | 'staff' | 'datetime' | 'review';

const STEPS: Step[] = ['service', 'client', 'staff', 'datetime', 'review'];

/** Safely extract name from AppointmentService (jsonb can be string or {en, fr}) */
function serviceName(name: { en: string; fr: string } | string | unknown): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object' && 'en' in name) return (name as { en: string }).en;
  return 'Appointment';
}

function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeDisplay(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

export function CreateAppointmentSheet({
  visible,
  onClose,
  preselectedClientId = null,
  preselectedDate = null,
  preselectedServiceType = null,
  followUpContext = null,
}: CreateAppointmentSheetProps) {
  // Form state - set initial step based on preselected values
  const [step, setStep] = useState<Step>(() => {
    if (preselectedServiceType) {
      // Skip service step, start at client or datetime
      if (preselectedClientId) {
        return 'datetime'; // Both service and client are pre-selected
      }
      return 'client'; // Only service is pre-selected
    }
    return 'service'; // Normal flow
  });
  const [selectedService, setSelectedService] = useState<AppointmentService | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (preselectedDate) {
      return new Date(preselectedDate + 'T12:00:00');
    }
    if (preselectedServiceType) {
      // Default to 2 weeks from now for follow-up bookings
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
      return twoWeeksFromNow;
    }
    return new Date();
  });
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState(followUpContext?.suggestedNotes || '');
  const [clientSearch, setClientSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // API hooks — only fetch when needed, guard against empty calls
  const { data: services, isLoading: servicesLoading } = useAppointmentServices();
  const { data: staffList } = useSchedulingStaff();

  // Only search clients when user has typed 2+ chars
  const { data: clientResults, isLoading: clientsLoading } = useClients(
    clientSearch.length >= 2 ? { q: clientSearch, limit: 8 } : undefined
  );

  // Only fetch slots when we have a date AND a service
  const dateStr = formatDateStr(selectedDate);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots({
    date: selectedService ? dateStr : '',
    typeId: selectedService?.id,
    staffId: selectedStaff?.id,
  });

  const createMutation = useCreateAppointment();

  // Auto-select service when preselectedServiceType is provided
  useEffect(() => {
    if (preselectedServiceType && services && services.length > 0 && !selectedService) {
      const matchingService = services.find((service) => {
        const name = serviceName(service.name).toLowerCase();
        return name.includes(preselectedServiceType);
      });
      if (matchingService) {
        setSelectedService(matchingService);
      }
    }
  }, [preselectedServiceType, services, selectedService]);

  // Auto-select client if preselected
  useEffect(() => {
    if (preselectedClientId && !selectedClient) {
      // The client will be resolved by the parent component passing it
      // For now, we trust that the parent will provide the client data
    }
  }, [preselectedClientId, selectedClient]);

  // Derived
  const availableSlots = useMemo(() => {
    if (!slots) return [];
    return slots.filter((s) => s.available);
  }, [slots]);

  const currentStepIndex = STEPS.indexOf(step);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'service': return !!selectedService;
      case 'client': return true; // optional
      case 'staff': return true; // optional
      case 'datetime': return !!selectedSlot;
      case 'review': return !!selectedService && !!selectedSlot;
    }
  }, [step, selectedService, selectedSlot]);

  // Handlers
  const handleNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]!);
  }, [step]);

  const handleBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]!);
  }, [step]);

  const handleSubmit = useCallback(() => {
    if (!selectedService || !selectedSlot) {
      toast.error('Missing required fields');
      return;
    }

    const title = serviceName(selectedService.name);

    const payload: CreateAppointmentPayload = {
      title,
      shopifyCustomerId: selectedClient?.id ?? null,
      staffId: selectedStaff?.id ?? selectedSlot.staffId ?? null,
      typeId: selectedService.id,
      startsAt: selectedSlot.startsAt,
      endsAt: selectedSlot.endsAt,
      notes: notes.trim() || null,
      locationId: selectedSlot.locationId ?? null,
      source: 'tablet',
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        // Show enhanced toast if client was selected (confirmation email is sent server-side)
        if (selectedClient?.email) {
          toast.success('Appointment created', `Confirmation sent to ${selectedClient.email}`);
        } else if (selectedClient) {
          toast.success('Appointment created', 'No email on file — confirm verbally');
        } else {
          toast.success('Appointment created');
        }
        resetAndClose();
      },
      onError: (err) => {
        toast.error('Failed to create', err.message);
      },
    });
  }, [selectedService, selectedSlot, selectedClient, selectedStaff, notes, createMutation]);

  const resetAndClose = useCallback(() => {
    // Reset to initial state based on preselected values
    if (preselectedServiceType) {
      setStep(preselectedClientId ? 'datetime' : 'client');
    } else {
      setStep('service');
    }
    setSelectedService(null);
    setSelectedClient(null);
    setSelectedStaff(null);
    setSelectedDate(() => {
      if (preselectedDate) {
        return new Date(preselectedDate + 'T12:00:00');
      }
      if (preselectedServiceType) {
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        return twoWeeksFromNow;
      }
      return new Date();
    });
    setSelectedSlot(null);
    setNotes(followUpContext?.suggestedNotes || '');
    setClientSearch('');
    onClose();
  }, [onClose, preselectedDate, preselectedServiceType, preselectedClientId, followUpContext]);

  const handleDateChange = useCallback((_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedSlot(null);
    }
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <View className="flex-1 bg-bg-surface">
        {/* Header */}
        <View className="flex-row items-center justify-between px-xl pt-xl pb-md border-b border-border">
          <Pressable
            onPress={resetAndClose}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X color="#404040" size={22} />
          </Pressable>
          <Text className="text-heading-md text-text-primary font-medium">New Appointment</Text>
          <View className="min-w-[44px]" />
        </View>

        {/* Step indicator */}
        <View className="flex-row px-xl py-md gap-xs">
          {STEPS.map((s, i) => (
            <View
              key={s}
              className={`flex-1 h-[3px] rounded-full ${
                i <= currentStepIndex ? 'bg-brand' : 'bg-bg-muted'
              }`}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'service' && (
            <ServiceStep
              services={services ?? []}
              isLoading={servicesLoading}
              selected={selectedService}
              onSelect={(s) => { setSelectedService(s); setSelectedSlot(null); }}
            />
          )}
          {step === 'client' && (
            <ClientStep
              search={clientSearch}
              onSearchChange={setClientSearch}
              results={clientResults?.clients ?? []}
              isLoading={clientsLoading}
              selected={selectedClient}
              onSelect={setSelectedClient}
              onClear={() => setSelectedClient(null)}
            />
          )}
          {step === 'staff' && (
            <StaffStep
              staff={staffList ?? []}
              selected={selectedStaff}
              onSelect={setSelectedStaff}
              onClear={() => { setSelectedStaff(null); setSelectedSlot(null); }}
            />
          )}
          {step === 'datetime' && (
            <DateTimeStep
              date={selectedDate}
              onDatePress={() => setShowDatePicker(true)}
              showDatePicker={showDatePicker}
              onDateChange={handleDateChange}
              onDismissDatePicker={() => setShowDatePicker(false)}
              slots={availableSlots}
              slotsLoading={slotsLoading}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              serviceDuration={selectedService?.durationMinutes ?? 30}
              hasService={!!selectedService}
              staffList={staffList ?? []}
            />
          )}
          {step === 'review' && (
            <ReviewStep
              service={selectedService}
              client={selectedClient}
              staff={selectedStaff}
              slot={selectedSlot}
              notes={notes}
              onNotesChange={setNotes}
            />
          )}
        </ScrollView>

        {/* Bottom actions */}
        <View className="px-xl py-lg border-t border-border bg-bg-surface">
          <View className="flex-row gap-md">
            {currentStepIndex > 0 && (
              <Pressable
                onPress={handleBack}
                className="min-h-[44px] px-lg items-center justify-center border border-border rounded-md"
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text className="text-body-lg text-text-primary">Back</Text>
              </Pressable>
            )}
            <View className="flex-1">
              {step === 'review' ? (
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={!canAdvance || createMutation.isPending}
                  loading={createMutation.isPending}
                  accessibilityLabel="Create appointment"
                >
                  Create Appointment
                </Button>
              ) : (
                <Pressable
                  onPress={handleNext}
                  disabled={!canAdvance}
                  className={`min-h-[44px] items-center justify-center rounded-md px-lg ${
                    canAdvance ? 'bg-brand' : 'bg-bg-muted'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to next step"
                >
                  <Text className={`text-body-lg font-medium ${
                    canAdvance ? 'text-brand-text' : 'text-text-muted'
                  }`}>
                    {step === 'client' ? (selectedClient ? 'Next' : 'Skip (walk-in)') :
                     step === 'staff' ? (selectedStaff ? 'Next' : 'Skip (any staff)') :
                     'Next'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Step Components ─────────────────────────────────────────

function ServiceStep({ services, isLoading, selected, onSelect }: {
  services: AppointmentService[];
  isLoading: boolean;
  selected: AppointmentService | null;
  onSelect: (s: AppointmentService) => void;
}) {
  if (isLoading) return <LoadingState />;

  return (
    <View className="gap-md">
      <Text className="text-heading-lg text-text-primary">What type of appointment?</Text>
      <Text className="text-body-md text-text-muted mb-sm">Select the service</Text>

      {services.length === 0 ? (
        <View className="p-xl items-center">
          <Text className="text-body-lg text-text-muted">No services configured</Text>
          <Text className="text-body-sm text-text-muted mt-xs">
            Configure appointment types in Foundry admin
          </Text>
        </View>
      ) : (
        <View className="gap-sm">
          {services.filter((s) => s.active).map((service) => {
            const isSelected = selected?.id === service.id;
            return (
              <Pressable
                key={service.id}
                onPress={() => onSelect(service)}
                className={`min-h-[44px] p-lg rounded-lg border flex-row items-center gap-md ${
                  isSelected ? 'border-brand bg-bg-surface' : 'border-border bg-bg-page'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`${serviceName(service.name)}, ${service.durationMinutes} minutes`}
              >
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-brand items-center justify-center">
                    <Check color="#FFFFFF" size={14} />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-body-lg text-text-primary">{serviceName(service.name)}</Text>
                  <Text className="text-body-sm text-text-muted">
                    {service.durationMinutes} min
                    {service.price ? ` · $${(service.price / 100).toFixed(0)}` : ' · Free'}
                  </Text>
                </View>
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: service.color || '#D4D4D4' }} // design-token-exception: dynamic API color
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ClientStep({ search, onSearchChange, results, isLoading, selected, onSelect, onClear }: {
  search: string;
  onSearchChange: (s: string) => void;
  results: Client[];
  isLoading: boolean;
  selected: Client | null;
  onSelect: (c: Client) => void;
  onClear: () => void;
}) {
  const clientName = (c: Client) =>
    [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || 'Unknown';

  return (
    <View className="gap-md">
      <Text className="text-heading-lg text-text-primary">Who is the appointment for?</Text>
      <Text className="text-body-md text-text-muted mb-sm">Search for a client, or skip for walk-in</Text>

      {selected ? (
        <View className="p-lg rounded-lg border border-brand bg-bg-surface flex-row items-center gap-md">
          <View className="w-10 h-10 rounded-full bg-bg-muted items-center justify-center">
            <User color="#737373" size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-body-lg text-text-primary">{clientName(selected)}</Text>
            {selected.email && <Text className="text-body-sm text-text-muted">{selected.email}</Text>}
          </View>
          <Pressable
            onPress={onClear}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Remove client"
          >
            <X color="#737373" size={18} />
          </Pressable>
        </View>
      ) : (
        <>
          <View className="flex-row items-center border border-border rounded-lg bg-bg-page px-md">
            <Search color="#737373" size={18} />
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Search by name or email..."
              placeholderTextColor="#737373"
              className="flex-1 min-h-[44px] px-sm text-body-lg text-text-primary"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {isLoading && search.length >= 2 && (
            <Text className="text-body-sm text-text-muted">Searching...</Text>
          )}

          {results.length > 0 && search.length >= 2 && (
            <View className="border border-border rounded-lg overflow-hidden">
              {results.map((client, idx) => (
                <Pressable
                  key={client.id}
                  onPress={() => onSelect(client)}
                  className={`min-h-[44px] p-md flex-row items-center gap-md ${
                    idx < results.length - 1 ? 'border-b border-border' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${clientName(client)}`}
                >
                  <View className="w-8 h-8 rounded-full bg-bg-muted items-center justify-center">
                    <User color="#737373" size={14} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-md text-text-primary">{clientName(client)}</Text>
                    {client.email && <Text className="text-body-xs text-text-muted">{client.email}</Text>}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function StaffStep({ staff, selected, onSelect, onClear }: {
  staff: StaffMember[];
  selected: StaffMember | null;
  onSelect: (s: StaffMember) => void;
  onClear: () => void;
}) {
  return (
    <View className="gap-md">
      <Text className="text-heading-lg text-text-primary">Assign to staff</Text>
      <Text className="text-body-md text-text-muted mb-sm">Pick a team member or skip for any available</Text>

      <View className="gap-sm">
        <Pressable
          onPress={onClear}
          className={`min-h-[44px] p-lg rounded-lg border flex-row items-center gap-md ${
            !selected ? 'border-brand bg-bg-surface' : 'border-border bg-bg-page'
          }`}
          accessibilityRole="button"
          accessibilityLabel="Any available staff"
        >
          {!selected && (
            <View className="w-6 h-6 rounded-full bg-brand items-center justify-center">
              <Check color="#FFFFFF" size={14} />
            </View>
          )}
          <Text className="text-body-lg text-text-primary">Any available</Text>
        </Pressable>

        {staff.map((member) => {
          const isSelected = selected?.id === member.id;
          return (
            <Pressable
              key={member.id}
              onPress={() => onSelect(member)}
              className={`min-h-[44px] p-lg rounded-lg border flex-row items-center gap-md ${
                isSelected ? 'border-brand bg-bg-surface' : 'border-border bg-bg-page'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`${member.name}, ${member.role}`}
            >
              {isSelected && (
                <View className="w-6 h-6 rounded-full bg-brand items-center justify-center">
                  <Check color="#FFFFFF" size={14} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-body-lg text-text-primary">{member.name}</Text>
                <Text className="text-body-sm text-text-muted">{member.role}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DateTimeStep({ date, onDatePress, showDatePicker, onDateChange, onDismissDatePicker, slots, slotsLoading, selectedSlot, onSelectSlot, serviceDuration, hasService, staffList }: {
  date: Date;
  onDatePress: () => void;
  showDatePicker: boolean;
  onDateChange: (event: unknown, date?: Date) => void;
  onDismissDatePicker: () => void;
  slots: TimeSlot[];
  slotsLoading: boolean;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (s: TimeSlot) => void;
  serviceDuration: number;
  hasService: boolean;
  staffList: StaffMember[];
}) {
  const dateDisplay = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // Deduplicate slots by time — show unique times, pick first available staff for each
  const uniqueSlots = useMemo(() => {
    const seen = new Map<string, TimeSlot>();
    for (const slot of slots) {
      const timeKey = slot.startsAt;
      if (!seen.has(timeKey)) {
        seen.set(timeKey, slot);
      }
    }
    return Array.from(seen.values()).sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  }, [slots]);

  // Check if multiple staff serve the same times (show staff picker per slot)
  const hasMultipleStaff = useMemo(() => {
    const staffIds = new Set(slots.map((s) => s.staffId));
    return staffIds.size > 1;
  }, [slots]);

  const getStaffName = (staffId: string) => {
    const member = staffList.find((s) => s.id === staffId);
    return member?.name ?? '';
  };

  return (
    <View className="gap-lg">
      <Text className="text-heading-lg text-text-primary">Pick a date and time</Text>

      {/* Date selector */}
      <View>
        <Text className="text-body-sm text-text-secondary mb-xs">Date</Text>
        <Pressable
          onPress={onDatePress}
          className="min-h-[44px] p-md rounded-lg border border-border bg-bg-page flex-row items-center gap-sm"
          accessibilityRole="button"
          accessibilityLabel={`Select date, currently ${dateDisplay}`}
        >
          <CalendarIcon color="#737373" size={18} />
          <Text className="text-body-lg text-text-primary flex-1">{dateDisplay}</Text>
          <Text className="text-body-sm text-text-muted">Change</Text>
        </Pressable>
      </View>

      {/* Inline date picker — give it proper height for iPad */}
      {showDatePicker && (
        <View className="border border-border rounded-lg overflow-hidden bg-bg-surface" style={{ minHeight: 420 }}>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            minimumDate={new Date()}
            onChange={onDateChange}
            style={{ height: 380 }}
          />
          {Platform.OS === 'ios' && (
            <Pressable onPress={onDismissDatePicker} className="p-md items-center border-t border-border">
              <Text className="text-body-md text-brand">Done</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Time slots */}
      <View>
        <Text className="text-body-sm text-text-secondary mb-xs">
          Available times ({serviceDuration} min)
        </Text>

        {!hasService ? (
          <Text className="text-body-md text-text-muted p-md">Select a service first</Text>
        ) : slotsLoading ? (
          <View className="p-lg items-center">
            <Text className="text-body-md text-text-muted">Loading available times...</Text>
          </View>
        ) : uniqueSlots.length === 0 ? (
          <View className="p-lg items-center rounded-lg bg-bg-muted">
            <Clock color="#737373" size={24} />
            <Text className="text-body-md text-text-muted mt-sm">No available slots</Text>
            <Text className="text-body-sm text-text-muted">Try another date or staff member</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-sm">
            {uniqueSlots.map((slot, idx) => {
              const isSelected = selectedSlot?.startsAt === slot.startsAt && selectedSlot?.staffId === slot.staffId;
              return (
                <Pressable
                  key={`${slot.startsAt}-${slot.staffId}-${idx}`}
                  onPress={() => onSelectSlot(slot)}
                  className={`min-h-[44px] px-lg py-sm rounded-md border items-center justify-center ${
                    isSelected ? 'border-brand bg-brand' : 'border-border bg-bg-page'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatTimeDisplay(slot.startsAt)} to ${formatTimeDisplay(slot.endsAt)}${hasMultipleStaff ? ` with ${getStaffName(slot.staffId)}` : ''}`}
                >
                  <Text className={`text-body-md font-medium ${isSelected ? 'text-brand-text' : 'text-text-primary'}`}>
                    {formatTimeDisplay(slot.startsAt)}
                  </Text>
                  {hasMultipleStaff && (
                    <Text className={`text-body-xs ${isSelected ? 'text-brand-text' : 'text-text-muted'}`}>
                      {getStaffName(slot.staffId)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function ReviewStep({ service, client, staff, slot, notes, onNotesChange }: {
  service: AppointmentService | null;
  client: Client | null;
  staff: StaffMember | null;
  slot: TimeSlot | null;
  notes: string;
  onNotesChange: (s: string) => void;
}) {
  const clientName = client
    ? [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email || 'Unknown'
    : 'Walk-in';

  return (
    <View className="gap-lg">
      <Text className="text-heading-lg text-text-primary">Review</Text>

      <View className="rounded-lg border border-border overflow-hidden">
        <SummaryRow label="Service" value={service ? serviceName(service.name) : '—'} />
        <SummaryRow label="Client" value={clientName} />
        <SummaryRow label="Staff" value={staff?.name ?? 'Any available'} />
        <SummaryRow label="Date" value={slot ? new Date(slot.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'} />
        <SummaryRow label="Time" value={slot ? `${formatTimeDisplay(slot.startsAt)} – ${formatTimeDisplay(slot.endsAt)}` : '—'} isLast />
      </View>

      <View>
        <Text className="text-body-sm text-text-secondary mb-xs">Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Add notes for this appointment..."
          placeholderTextColor="#737373"
          multiline
          numberOfLines={3}
          className="p-md text-body-lg border border-border rounded-lg bg-bg-page text-text-primary"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row items-center p-md ${!isLast ? 'border-b border-border' : ''}`}>
      <Text className="text-body-md text-text-muted w-[80px]">{label}</Text>
      <Text className="text-body-lg text-text-primary flex-1">{value}</Text>
    </View>
  );
}

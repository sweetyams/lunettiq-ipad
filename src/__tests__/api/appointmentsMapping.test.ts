import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/api/client', () => ({ api: { get: vi.fn() } }));

import { splitTitle, toAppointment, toInventoryHold, toSchedulingParams, type FoundryAppointmentRow } from '@/src/api/appointmentsMapping';

const row = (overrides: Partial<FoundryAppointmentRow> = {}): FoundryAppointmentRow => ({
  id: 'a1',
  title: 'Eye exam',
  customerId: 'c1',
  startsAt: '2026-10-15T13:30:00.000Z',
  endsAt: '2026-10-15T14:15:00.000Z',
  status: 'confirmed',
  createdAt: '2026-10-15T00:00:00.000Z',
  updatedAt: '2026-10-15T00:00:00.000Z',
  ...overrides,
});

describe('appointmentsMapping', () => {
  it('splits "Type — Name" titles and leaves plain titles as the type', () => {
    expect(splitTitle('Eye exam — Camille Tremblay')).toEqual({ type: 'Eye exam', name: 'Camille Tremblay' });
    expect(splitTitle('Styling consultation')).toEqual({ type: 'Styling consultation', name: null });
    expect(splitTitle(null)).toEqual({ type: 'Appointment', name: null });
  });

  it('maps a Foundry row to the iPad shape with duration and client id', () => {
    const a = toAppointment(row(), new Map([['c1', 'Camille Tremblay']]));
    expect(a).toMatchObject({ id: 'a1', clientId: 'c1', clientName: 'Camille Tremblay', type: 'Eye exam', duration: 45, status: 'confirmed' });
  });

  it('prefers a name Foundry sends, then the lookup, then the title', () => {
    expect(toAppointment(row({ clientName: 'From API' }), new Map([['c1', 'Lookup']])).clientName).toBe('From API');
    expect(toAppointment(row({ title: 'Eye exam — From Title' })).clientName).toBe('From Title');
    expect(toAppointment(row({ customerId: null })).clientName).toBeNull();
  });

  it('sends the date-range params Foundry reads', () => {
    expect(toSchedulingParams({ from: '2026-10-12', to: '2026-10-18', locationId: 'loc' })).toEqual({
      dateFrom: '2026-10-12T00:00:00',
      dateTo: '2026-10-18T23:59:59',
      locationId: 'loc',
    });
    expect(toSchedulingParams({ date: '2026-10-15' })).toEqual({ date: '2026-10-15' });
    expect(toSchedulingParams(undefined)).toBeUndefined();
  });

  it('labels a hold from its note and links the client', () => {
    expect(toInventoryHold({
      id: 'h1', familyId: 'f1', colour: 'BLUE', note: 'JUNE © BLUE for Sophie Gagnon',
      referenceId: 'c1', referenceType: 'customer', expiresAt: '2026-10-16T18:00:00.000Z', createdAt: '2026-10-15T00:00:00.000Z',
    })).toMatchObject({ productName: 'JUNE © BLUE for Sophie Gagnon', clientId: 'c1', expiresAt: '2026-10-16T18:00:00.000Z' });
    expect(toInventoryHold({ id: 'h2', colour: 'RED', createdAt: 'x' }).productName).toBe('Frame · RED');
  });
});

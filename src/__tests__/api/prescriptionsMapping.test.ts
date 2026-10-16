import { describe, it, expect } from 'vitest';
import { sortPrescriptions, toPrescription } from '@/src/api/prescriptionsMapping';

describe('prescriptions mapping', () => {
  it('maps Foundry text optics, date, prescriber and status', () => {
    const rx = toPrescription({
      id: 'p1', customerId: 'c1', sphereOd: '-1.75', cylinderOd: '-0.75', axisOd: 97, addOd: null,
      sphereOs: '+0.50', cylinderOs: '', axisOs: 92, pdSingle: '63', prescriptionDate: '2026-09-12',
      prescriberName: 'Dr Roy', clinicName: 'Clinique Saint-Denis', status: 'verified', createdAt: '2026-09-13T10:00:00Z',
    });
    expect(rx).toMatchObject({
      clientId: 'c1', sphereOd: -1.75, cylinderOd: -0.75, axisOd: 97, addOd: undefined, sphereOs: 0.5, cylinderOs: undefined,
      pdRight: 31.5, pdLeft: 31.5, prescribedAt: '2026-09-12', prescribedBy: 'Dr Roy', clinicName: 'Clinique Saint-Denis',
      status: 'verified', verified: true,
    });
    expect(rx.type).toBeUndefined();
  });

  it('treats unknown status as submitted and sorts newest exam first', () => {
    const a = toPrescription({ id: 'a', customerId: 'c', status: 'pending_review', prescriptionDate: '2025-01-01', createdAt: '2025-01-02T00:00:00Z' });
    const b = toPrescription({ id: 'b', customerId: 'c', prescriptionDate: '2026-03-01', createdAt: '2026-03-02T00:00:00Z' });
    const c = toPrescription({ id: 'c', customerId: 'c', createdAt: '2025-06-01T00:00:00Z' });
    expect(a.status).toBe('submitted');
    expect(a.verified).toBe(false);
    expect(sortPrescriptions([a, c, b]).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
});

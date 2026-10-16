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

describe('prescription create payload', () => {
  it('writes Foundry columns with text optics and the right PD type', async () => {
    const { toFoundryPrescriptionInput } = await import('@/src/api/prescriptionsMapping');
    const single = toFoundryPrescriptionInput({ clientId: 'c1', sphereOd: -1.5, cylinderOd: -0.75, axisOd: 90, sphereOs: 0, addOs: 2, pdSingle: 63, prescribedBy: ' Dr Roy ', prescribedAt: '2026-09-12' });
    expect(single).toMatchObject({
      customerId: 'c1', shopifyCustomerId: 'c1', sphereOd: '-1.50', cylinderOd: '-0.75', axisOd: 90, sphereOs: '0.00', addOs: '+2.00',
      pdType: 'single', pdSingle: '63', pdRight: null, prescriberName: 'Dr Roy', prescriptionDate: '2026-09-12', status: 'submitted',
    });
    const dual = toFoundryPrescriptionInput({ clientId: 'c1', pdSingle: 63, pdRight: 31.5, pdLeft: 32 });
    expect(dual).toMatchObject({ pdType: 'dual', pdSingle: null, pdRight: '31.5', pdLeft: '32' });
  });
});

import { describe, it, expect } from 'vitest';
import { toApprovalView, signOffBlockers, signOffErrorMessage, CHECKLIST_SECTIONS } from '@/src/api/approvalDetail';

// The demo seed's snapshot spelling.
const seeded = {
  id: 'a1', orderId: 'o1', clientId: null, status: 'in_review', priority: 'high', claimedBy: 'user_1',
  snapshot: {
    rx: { odSph: '-1.50', osSph: '-1.25' }, lens: 'single_vision 1.59', frame: 'JUNE © BLUE', clientName: 'Liam Bergeron', clientId: 'c1',
    stylistNote: 'Measured PD differs from the prescription.', measurements: { pd: 58, vertex: 12, segHeight: 18 },
    flags: [{ type: 'pd_mismatch', message: 'PD difference: measured 58 mm vs 64 mm' }],
  },
  reviewSession: { checklist: { rx: { markedAt: '2026-11-26T15:00:00Z' } }, dwellSeconds: 20 },
};

// The web's snapshot spelling with Foundry flag rows.
const web = {
  id: 'a2', orderId: 'o2', clientId: 'c2', clientName: 'Sophie Gagnon', status: 'in_review', priority: 'flagged', claimedBy: 'user_1',
  snapshot: {
    rx: { sphereOd: -2, cylinderOd: -0.5, axisOd: 90, sphereOs: 0.75, pdRight: 31, pdLeft: 32, prescriberName: 'Dr Roy' },
    measurements: { pdSingle: 63, segHeightOd: 19, segHeightOs: 20, method: 'pupillometer' },
    order: { lineItems: [{ frameSku: 'NOA', frameColour: 'BLACK', lensType: 'progressive', lensMaterial: '1.67', lensTreatments: ['ar', 'blue'] }] },
    stylistNotes: 'Wants thin lenses.',
  },
  flags: [{ id: 'f1', ruleCode: 'rx_expired', severity: 'block', resolvedAt: null }, { id: 'f2', ruleCode: 'pd_mismatch', severity: 'warn', resolvedAt: '2026-11-26' }],
  reviewSession: { checklist: Object.fromEntries(CHECKLIST_SECTIONS.map((s) => [s, { markedAt: 'x' }])), dwellSeconds: 200 },
};

describe('approval review view', () => {
  it('reads the demo seed’s snapshot', () => {
    const v = toApprovalView(seeded);
    expect(v.clientName).toBe('Liam Bergeron');
    expect(v.clientId).toBe('c1');
    expect(v.rx).toEqual([{ label: 'Right (OD)', value: 'SPH −1.50' }, { label: 'Left (OS)', value: 'SPH −1.25' }]);
    expect(v.measurements).toEqual([{ label: 'PD', value: '58 mm' }, { label: 'Seg height', value: '18 mm' }, { label: 'Vertex', value: '12 mm' }]);
    expect(v.frameLens).toEqual([{ label: 'Frame', value: 'June © Blue' }, { label: 'Lenses', value: 'Single Vision 1.59' }]);
    expect(v.flags[0]!.label).toMatch(/PD difference/);
    expect(v.notes).toMatch(/Measured PD/);
    expect(v.priority).toBe('high');
    expect(v.reviewed.rx).toBe(true);
    expect(v.reviewed.notes).toBe(false);
  });

  it('reads the web’s snapshot and Foundry flag rows', () => {
    const v = toApprovalView(web);
    expect(v.rx[0]).toEqual({ label: 'Right (OD)', value: 'SPH −2.00  CYL −0.50  AXIS 90°' });
    expect(v.rx).toContainEqual({ label: 'PD', value: '31 / 32' });
    expect(v.rx).toContainEqual({ label: 'Prescriber', value: 'Dr Roy' });
    expect(v.measurements).toContainEqual({ label: 'Seg height', value: '19 / 20 mm' });
    expect(v.frameLens).toContainEqual({ label: 'Treatments', value: 'ar, blue' });
    expect(v.blockingFlags).toBe(1);
    expect(v.dwellFloor).toBe(120);
    expect(v.flags[0]!.resolved).toBe(false);
  });

  it('lists what stands between the optician and sign-off', () => {
    expect(signOffBlockers(toApprovalView(seeded))).toEqual(['Mark 5 sections reviewed', 'Keep reviewing 40s more']);
    expect(signOffBlockers(toApprovalView(web))).toEqual(['Resolve 1 blocking flag']);
    const ready = toApprovalView({ ...web, flags: [] });
    expect(signOffBlockers(ready)).toEqual([]);
  });

  it('turns Foundry refusals into words', () => {
    expect(signOffErrorMessage({ code: 'PRECONDITION_FAILED', details: { failed: ['dwell'] } })).toMatch(/review time/);
    expect(signOffErrorMessage({ code: 'CREDENTIAL_INVALID', details: { reason: 'expired' } })).toMatch(/expired/);
  });
});

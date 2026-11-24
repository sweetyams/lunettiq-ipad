import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/api/client', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-native-mmkv', () => ({
  MMKV: class { getString() { return undefined; } set() {} delete() {} },
}));

import { businessDaysBetween, addBusinessDays, leadTimeStatus } from '@/src/features/orders/leadTime';
import { toOrderItem, lateOrders, stageLabel } from '@/src/api/ordersMapping';
import { renderTemplate, joinFrames, smsUrl, mailUrl, OUTCOME_TEMPLATE } from '@/src/features/messages/templates';
import { LUNETTIQ_MEASUREMENTS, validateRecord, cleanValues, readMeasurements, withMeasurement, summarize } from '@/src/features/client-profile/measurements';
import { parseFrameSize, frameSizeOf, rxFitFlags, isLikelyProgressive } from '@/src/features/visit/rxFit';
import { readHandoff, withHandoff, readCollection, missingRoles, handoffLine } from '@/src/features/client-profile/clientFile';
import { dayKey, prune, tapReducer, undoReducer } from '@/src/features/floor/useWalkInCounter';
import { namedPicks, rankProducts } from '@/src/features/visit/styleFinder';
import type { Prescription } from '@/src/api/prescriptions.types';

// Monday 2026-11-02, 10:00 local
const MON = new Date(2026, 10, 2, 10).getTime();
const day = (n: number) => MON + n * 86_400_000;

describe('lead time (10–12 business days)', () => {
  it('counts weekdays only', () => {
    expect(businessDaysBetween(MON, day(4))).toBe(4); // Mon → Fri
    expect(businessDaysBetween(MON, day(7))).toBe(5); // Mon → next Mon
    expect(businessDaysBetween(day(4), day(7))).toBe(1); // Fri → Mon
    expect(businessDaysBetween(day(5), MON)).toBe(0);
  });

  it('promises 12 business days later', () => {
    const d = addBusinessDays(MON, 12);
    expect(d.getDate()).toBe(18); // Wed Nov 18
  });

  it('flags running late past 10 and late past 12, only in production', () => {
    const iso = new Date(MON).toISOString();
    expect(leadTimeStatus({ state: 'at_lab', createdAt: iso }, day(14))?.lateness).toBe('on_time'); // 10 bd
    expect(leadTimeStatus({ state: 'at_lab', createdAt: iso }, day(15))?.lateness).toBe('running_late'); // 11
    expect(leadTimeStatus({ state: 'at_lab', createdAt: iso }, day(17))?.lateness).toBe('late'); // 13
    expect(leadTimeStatus({ state: 'awaiting_rx', createdAt: iso }, day(30))).toBeNull();
    expect(leadTimeStatus({ state: 'picked_up', createdAt: iso }, day(30))).toBeNull();
  });

  it('maps orders to the store’s stages and lists late ones first', () => {
    const iso = new Date(MON).toISOString();
    const a = toOrderItem({ id: 'a', state: 'at_lab', createdAt: iso, staffName: 'Léa' }, day(17));
    const b = toOrderItem({ id: 'b', state: 'received_from_lab', createdAt: iso }, day(15));
    const c = toOrderItem({ id: 'c', state: 'optician_review', createdAt: iso }, day(1));
    expect(a).toMatchObject({ stage: 'at_lab', lateness: 'late', staffName: 'Léa', purchasedAt: iso });
    expect(b.stage).toBe('arrived');
    expect(c.stage).toBe('pending_approval');
    expect(lateOrders([c, b, a]).map((o) => o.id)).toEqual(['a', 'b']);
    expect(stageLabel('awaiting_rx')).toBe('Paid, waiting for Rx');
    expect(stageLabel('pending_approval', 'fr')).toBe('En attente d’approbation');
  });
});

describe('message templates', () => {
  it('fills names and frames, in both languages, with no discount talk', () => {
    const en = renderTemplate('visit_choices', 'en', { firstName: 'Marie', staffName: 'Léa', frames: joinFrames(['Marais', 'June'], 'en') });
    expect(en.body).toContain('Hi Marie');
    expect(en.body).toContain('Marais and June');
    const fr = renderTemplate('visit_choices', 'fr', { firstName: 'Marie', frames: joinFrames(['Marais', 'June', 'Hatley'], 'fr') });
    expect(fr.body).toContain('Marais, June et Hatley');
    for (const k of Object.values(OUTCOME_TEMPLATE)) {
      expect(renderTemplate(k, 'en', {}).body.toLowerCase()).not.toMatch(/discount|% off|code/);
    }
  });

  it('reads cleanly with no first name', () => {
    expect(renderTemplate('left_empty_handed', 'en', {}).body.startsWith('Hi, thanks')).toBe(true);
  });

  it('builds sms and mail links only for usable contacts', () => {
    expect(smsUrl('(514) 555-0101', 'Hi there')).toBe('sms:5145550101&body=Hi%20there');
    expect(smsUrl('', 'x')).toBeNull();
    expect(mailUrl('marie@example.com', 'S', 'B')).toBe('mailto:marie%40example.com?subject=S&body=B');
    expect(mailUrl('nope', 'S', 'B')).toBeNull();
  });
});

describe('measurement template', () => {
  it('validates ranges, accepts blanks and decimal commas', () => {
    const errors = validateRecord(LUNETTIQ_MEASUREMENTS, { 'pd.od': '31,5', 'pd.os': '90', 'ocHeight.od': '', 'lensometer.od': '-2.25 -0.50 x180' });
    expect(errors['pd.od']).toBeUndefined();
    expect(errors['pd.os']).toMatch(/20–40/);
    expect(errors['lensometer.od']).toBeUndefined();
    expect(cleanValues(LUNETTIQ_MEASUREMENTS, { 'pd.od': '31,5', notes: ' ', opticianName: 'J. Roy' })).toEqual({ 'pd.od': '31.5', opticianName: 'J. Roy' });
  });

  it('keeps a newest-first history on customFields and summarizes it', () => {
    const r1 = { id: '1', templateId: 't', templateVersion: 1, takenAt: '2026-01-01T00:00:00Z', values: { pdBinocular: '62' } };
    const r2 = { id: '2', templateId: 't', templateVersion: 1, takenAt: '2026-11-01T00:00:00Z', values: { 'pd.od': '31', 'pd.os': '31.5', opticianName: 'J. Roy' } };
    const cf = withMeasurement(withMeasurement({ other: 1 }, r1), r2);
    expect(cf.other).toBe(1);
    expect(readMeasurements(cf).map((r) => r.id)).toEqual(['2', '1']);
    expect(summarize(readMeasurements(cf)[0])).toBe('PD 31/31.5 · J. Roy');
    expect(readMeasurements({ measurements: 'junk' })).toEqual([]);
  });
});

describe('Rx fit flag', () => {
  const rx = (o: Partial<Prescription>): Prescription => ({ id: 'r', clientId: 'c', verified: false, createdAt: '', updatedAt: '', ...o });

  it('parses common size notations', () => {
    expect(parseFrameSize('Marais 52□18-145')).toEqual({ lensWidth: 52, bridge: 18, lensHeight: null });
    expect(parseFrameSize('49-21-140').lensWidth).toBe(49);
    expect(parseFrameSize('Blue acetate')).toEqual({ lensWidth: null, bridge: null, lensHeight: null });
    expect(frameSizeOf({ title: 'June', metafields: { lens_width: '54', lens_height: 26 } })).toEqual({ lensWidth: 54, bridge: null, lensHeight: 26 });
  });

  it('warns on strong prescriptions in big lenses, never on mild ones', () => {
    expect(rxFitFlags(rx({ sphereOd: -6.5, sphereOs: -6 }), { lensWidth: 54, bridge: 18, lensHeight: null }).map((f) => f.key)).toEqual(['high_minus_wide']);
    expect(rxFitFlags(rx({ sphereOd: -1 }), { lensWidth: 56, bridge: 18, lensHeight: null })).toEqual([]);
    expect(rxFitFlags(rx({ sphereOd: 1, addOd: 2 }), { lensWidth: 50, bridge: 18, lensHeight: 25 }).map((f) => f.key)).toEqual(['progressive_short']);
    expect(rxFitFlags(null, { lensWidth: 60, bridge: 18, lensHeight: 20 })).toEqual([]);
    expect(isLikelyProgressive(rx({ addOs: 1.5 }))).toBe(true);
  });
});

describe('client file: handoff and collection', () => {
  it('round-trips handoff and drops it when empty', () => {
    const h = { reasons: ['sunglasses' as const, 'travel' as const], note: '', when: 'Dec 12', updatedAt: '', updatedBy: null };
    const cf = withHandoff({ a: 1 }, h);
    expect(readHandoff(cf)?.reasons).toEqual(['sunglasses', 'travel']);
    expect(handoffLine(readHandoff(cf), 'en')).toBe('Sunglasses, Travel · by Dec 12');
    expect(withHandoff(cf, { ...h, reasons: [], when: '' }).handoff).toBeUndefined();
    expect(readHandoff({ handoff: { reasons: ['nope'] } })).toBeNull();
  });

  it('shows which core pairs are missing', () => {
    const pairs = readCollection({ collection: [{ id: '1', role: 'everyday', frame: 'Marais', fromUs: true }, { id: 'x', role: 'bogus', frame: 'y' }] });
    expect(pairs).toHaveLength(1);
    expect(missingRoles(pairs)).toEqual(['going_out', 'sun']);
  });
});

describe('walk-in counter', () => {
  it('keys by local day and store, prunes old days', () => {
    expect(dayKey('loc1', new Date(2026, 10, 24, 9))).toBe('2026-11-24|loc1');
    const kept = prune({ '2026-11-24|a': { cameIn: 1, helped: 0, taps: [] }, '2026-10-01|a': { cameIn: 3, helped: 0, taps: [] } }, new Date(2026, 10, 24));
    expect(Object.keys(kept)).toEqual(['2026-11-24|a']);
  });

  it('counts taps and undoes without going negative', () => {
    const d = tapReducer(tapReducer(undefined, 1), 2);
    expect(d.cameIn).toBe(2);
    expect(undoReducer(undoReducer(undoReducer(d))).cameIn).toBe(0);
  });
});

describe('style finder', () => {
  const products = [
    { title: 'JUNE © BLUE', tags: ['acetate', 'oversized'] },
    { title: 'Marais Tortoise', tags: ['round', 'tortoise'] },
    { title: 'Hatley Black', tags: ['square'] },
  ];
  it('funky + oversized puts June first (store rule)', () => {
    const a = { personality: 'funky' as const, size: 'oversized' as const };
    expect(namedPicks(a)).toHaveLength(1);
    expect(rankProducts(products, a)[0]?.product.title).toBe('JUNE © BLUE');
  });
  it('keywords narrow when no rule matches', () => {
    expect(rankProducts(products, { shape: 'round', tone: 'tortoise' }).map((r) => r.product.title)).toEqual(['Marais Tortoise']);
  });
});

import { eventText, collapseEvents, toRxCaptureBody } from '@/src/api/useOrderDetail';
import { orderActions, receivingOutcome } from '@/src/features/orders/orderActions';

describe('order timeline and actions', () => {
  it('reads event text from Foundry payload and collapses repeats', () => {
    expect(eventText({ id: '1', eventType: 'note', createdAt: '', payload: { note: 'Called lab' } })).toBe('Called lab');
    expect(eventText({ id: '2', eventType: 'anomaly_flagged', createdAt: '', payload: { reason: 'Stale: 7+ days' } })).toBe('Stale: 7+ days');
    const ev = (id: string, d: string) => ({ id, eventType: 'anomaly_flagged', createdAt: `2026-10-${d}T10:00:00Z`, payload: { reason: 'Stale' } });
    const out = collapseEvents([ev('a', '22'), ev('b', '22'), ev('c', '21')]);
    expect(out.map((e) => e.count)).toEqual([2, 1]);
  });

  it('offers what each role can do at each state', () => {
    expect(orderActions('awaiting_rx', { canWrite: true, canVerify: false })).toEqual(['add_rx', 'remind_rx', 'add_note']);
    expect(orderActions('ready_for_lab', { canWrite: true, canVerify: false })).not.toContain('send_to_lab');
    expect(orderActions('ready_for_lab', { canWrite: true, canVerify: true })).toContain('send_to_lab');
    expect(orderActions('at_lab', { canWrite: true, canVerify: true })).toEqual(['lab_confirmed', 'arrived', 'mark_delayed', 'add_note']);
    expect(receivingOutcome([])).toBe('ready');
    expect(receivingOutcome(['extras'])).toBe('missing_items');
    expect(receivingOutcome(['power', 'extras'])).toBe('redo');
  });

  it('maps a captured Rx to Foundry’s /api/rx/capture body', () => {
    const b = toRxCaptureBody({ customerId: 'c1', rxOrderId: 'o1', od: { sphere: -2 }, os: { sphere: -2.25 }, pd: { right: 31, left: 31.5 }, source: 'ocr', confidence: 0.9 });
    expect(b).toMatchObject({ customerId: 'c1', rxOrderId: 'o1', auth: { type: 'staff' }, submission: { source: 'ocr', pd: { type: 'dual', right: 31, left: 31.5 } } });
    expect(toRxCaptureBody({ customerId: 'c1', od: {}, os: {}, source: 'manual' }).submission).not.toHaveProperty('pd');
  });
});

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/api/client', () => ({ api: { get: vi.fn() } }));

import { ageLevel, frameLabel, toOrderItem } from '@/src/api/ordersMapping';
import { dueFor, signalsLabel, sortFollowUps, toFollowUp } from '@/src/api/hotLeadsMapping';
import { formatWaiting, toReviewItem } from '@/src/api/rxMapping';

const NOW = Date.parse('2026-10-16T16:00:00.000Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe('orders', () => {
  it('maps Foundry states to floor stages with age and money', () => {
    const o = toOrderItem({
      id: 'o1', state: 'optician_review', stateEnteredAt: daysAgo(1), customerName: 'Camille Tremblay',
      canonicalCustomerId: 'c1', frameSku: 'MARAIS-CRIMSON', lensType: 'progressive',
      depositCents: 30000, totalCents: 83900, createdAt: daysAgo(2),
    }, NOW);
    expect(o).toMatchObject({ stage: 'in_review', clientId: 'c1', daysInStage: 1, balanceCents: 53900, description: 'Marais Crimson · Progressive' });
    expect(toOrderItem({ id: 'o2', state: 'picked_up', createdAt: daysAgo(1) }, NOW).stage).toBe('done');
  });

  it('flags ageing on the Awaiting Rx cadence', () => {
    expect(ageLevel({ stage: 'awaiting_rx', daysInStage: 2 })).toBe('ok');
    expect(ageLevel({ stage: 'awaiting_rx', daysInStage: 11 })).toBe('warn');
    expect(ageLevel({ stage: 'awaiting_rx', daysInStage: 23 })).toBe('late');
    expect(frameLabel('HATLEY-TORTOISE')).toBe('Hatley Tortoise');
  });
});

describe('follow-ups', () => {
  it('derives urgency from the day 3 / 7 / 14 cadence', () => {
    expect(dueFor('open', 2)).toBe('new');
    expect(dueFor('day3_sent', 3)).toBe('email_sent');
    expect(dueFor('day7_queued', 7)).toBe('call_now');
    expect(dueFor('contacted', 13)).toBe('last_chance');
  });

  it('describes signals and sorts most urgent first', () => {
    expect(signalsLabel({ emailOpens: 2, returnVisits: 1 })).toBe('Email opened 2× · Came back once');
    expect(signalsLabel({})).toBeNull();
    const items = [
      toFollowUp({ id: 'a', customerId: 'c', status: 'open', priority: 'warm', daysSinceCreated: 2, createdAt: '' }, NOW),
      toFollowUp({ id: 'b', customerId: 'c', status: 'day7_queued', priority: 'cold', daysSinceCreated: 7, createdAt: '' }, NOW),
      toFollowUp({ id: 'c', customerId: 'c', status: 'day7_queued', priority: 'hot', daysSinceCreated: 7, createdAt: '' }, NOW),
    ];
    expect(sortFollowUps(items).map((i) => i.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('review inbox', () => {
  it('reads the snapshot and surfaces anomalies', () => {
    const r = toReviewItem({
      id: 'r1', orderId: 'o1', clientId: 'c1', status: 'submitted', priority: 'high', flagsOpen: 1,
      submittedAt: new Date(NOW - 14 * 60_000).toISOString(), createdAt: '',
      snapshot: { clientName: 'Liam Bergeron', frame: 'JUNE © BLUE', lens: 'single_vision 1.59', measurements: { pd: 58 }, flags: [{ message: 'PD difference' }] },
    }, new Map(), NOW);
    expect(r).toMatchObject({ clientName: 'Liam Bergeron', priority: 'high', pd: 58, anomaly: 'PD difference', minutesWaiting: 14, description: 'June © Blue · Single vision 1.59' });
    expect(toReviewItem({ id: 'r2', orderId: 'o', clientId: 'c2', status: 'in_review', createdAt: '' }, new Map([['c2', 'Noah Fortin']]), NOW).clientName).toBe('Noah Fortin');
  });

  it('formats waiting time', () => {
    expect(formatWaiting(2)).toBe('2m');
    expect(formatWaiting(65)).toBe('1h 5m');
    expect(formatWaiting(3 * 24 * 60)).toBe('3d');
  });
});

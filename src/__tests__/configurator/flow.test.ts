import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/api/client', () => ({ api: { get: vi.fn() } }));
import { visibleSteps, isSelectable, stepComplete, pruneSelections, defaultSelections } from '@/src/features/configurator/flow';
import { computePriceDelta, normaliseLensColour } from '@/src/api/useConfigurator';
import type { ConfiguratorSnapshot, SnapshotChoice, SnapshotGroup } from '@/src/api/configurator.types';

const c = (id: string, groupId: string, extra: Partial<SnapshotChoice> = {}): SnapshotChoice => ({
  id, code: id, label: { en: id }, choiceType: 'standard', priceDelta: 0, shopifyProductId: null, lensColourSetId: null,
  sortOrder: 0, groupId, ...extra,
});
const g = (id: string, choices: SnapshotChoice[], extra: Partial<SnapshotGroup> = {}): SnapshotGroup => ({
  id, code: id, label: { en: id }, selectionType: 'single', isRequired: true, sortOrder: 0, choices, ...extra,
});

// Shaped like the live Sunglasses flow.
const snapshot: ConfiguratorSnapshot = {
  flow: { id: 'f', name: { en: 'Sunglasses' } },
  steps: [
    { id: 's1', name: { en: 'Lens type' }, sortOrder: 0, groups: [
      g('rx', [c('nonrx', 'rx'), c('words', 'rx', { choiceType: 'content' }), c('sv', 'rx', { comingSoon: true }), c('fatigue', 'rx', { comingSoon: true, priceDelta: 9000 })]),
      g('help', [c('book', 'help', { choiceType: 'link' })], { isRequired: false }),
    ] },
    { id: 's2', name: { en: 'Lens' }, sortOrder: 1, groups: [
      g('lens', [c('standard', 'lens'), c('polar', 'lens', { choiceType: 'colour', lensColourSetId: 'Polarized' })]),
    ] },
    { id: 's3', name: { en: 'Thickness' }, sortOrder: 2, groups: [
      g('thick', [c('150', 'thick'), c('167', 'thick', { priceDelta: 10000 })]),
    ] },
  ],
  conditionSets: [
    // Thickness only once a lens type is picked.
    { id: 'cs1', targetType: 'step', targetId: 's3', logic: 'all', conditions: [{ field: 'rx', operator: 'eq', value: 'nonrx' }] },
  ],
};

describe('configurator flow', () => {
  it('words, links and coming-soon choices are shown but not pickable', () => {
    const choices = snapshot.steps[0]!.groups[0]!.choices;
    expect(choices.map(isSelectable)).toEqual([true, false, false, false]);
  });

  it('hides a step until its condition is met', () => {
    expect(visibleSteps(snapshot, {}).map((s) => s.id)).toEqual(['s1', 's2']);
    expect(visibleSteps(snapshot, { rx: ['nonrx'] }).map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('a group with only words or links never blocks Next', () => {
    const step = visibleSteps(snapshot, {})[0]!;
    expect(stepComplete(step, {})).toBe(false);
    expect(stepComplete(step, { rx: ['nonrx'] })).toBe(true);
  });

  it('drops picks a change has hidden', () => {
    expect(pruneSelections(snapshot, { rx: ['sv'], thick: ['167'] })).toEqual({ rx: ['sv'] });
    expect(pruneSelections(snapshot, { rx: ['nonrx'], thick: ['167'] })).toEqual({ rx: ['nonrx'], thick: ['167'] });
  });

  it('pre-picks the only pickable choice of a required group', () => {
    expect(defaultSelections(snapshot)).toEqual({ rx: ['nonrx'] });
  });

  it('prices a choice from its own priceDelta when there is no price rule', () => {
    const all = snapshot.steps.flatMap((s) => s.groups.flatMap((gr) => gr.choices));
    expect(computePriceDelta({ thick: ['167'] }, all, [], [], {})).toBe(10000);
    expect(computePriceDelta({ thick: ['167'] }, all, [{ ownerId: '167', amount: 6000, label: null, ruleType: 'delta' }], [], {})).toBe(6000);
  });

  it('adds the tint price for a colour choice', () => {
    const all = snapshot.steps.flatMap((s) => s.groups.flatMap((gr) => gr.choices));
    const tint = normaliseLensColour({ id: 'pb', code: 'pb', label: { en: 'Polarized black' }, hexCode: '#111', price: 5000, category: 'sun', status: 'active', setName: 'Polarized' } as never);
    expect(tint.hexStart).toBe('#111');
    expect(computePriceDelta({ lens: ['polar'] }, all, [], [tint], { 'lens:polar:colour': 'pb' })).toBe(5000);
  });
});

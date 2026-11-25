/**
 * What the configurator shows, the way lunettiq.com decides it (Foundry
 * configurator/storefront/evaluator.ts): steps, groups and choices with
 * condition sets show only when earlier picks match; words, links and
 * "coming soon" choices are shown but can't be picked. Pure, tested.
 */
import type {
  ConfiguratorSelections,
  ConfiguratorSnapshot,
  SnapshotChoice,
  SnapshotConditionSet,
  SnapshotGroup,
  SnapshotStep,
} from '@/src/api/configurator.types';

/** groupId and group code → first picked choice id / code. */
export function buildEvalContext(steps: SnapshotStep[], selections: ConfiguratorSelections): Record<string, string> {
  const ctx: Record<string, string> = {};
  for (const step of steps) {
    for (const group of step.groups) {
      const first = selections[group.id]?.[0];
      if (!first) continue;
      ctx[group.id] = first;
      const choice = group.choices.find((c) => c.id === first);
      if (group.code && choice) ctx[group.code] = choice.code;
    }
  }
  return ctx;
}

function passes(field: string, operator: string, value: unknown, ctx: Record<string, string>): boolean {
  const actual = ctx[field];
  switch (operator) {
    case 'eq': return actual === String(value);
    case 'neq': return actual !== String(value);
    case 'gt': return actual != null && Number(actual) > Number(value);
    case 'gte': return actual != null && Number(actual) >= Number(value);
    case 'lt': return actual != null && Number(actual) < Number(value);
    case 'lte': return actual != null && Number(actual) <= Number(value);
    case 'in': return Array.isArray(value) && value.map(String).includes(actual ?? '');
    case 'not_in': return Array.isArray(value) && !value.map(String).includes(actual ?? '');
    case 'contains': return actual != null && actual.includes(String(value));
    default: return true;
  }
}

/** No condition sets → visible. Otherwise every set must pass (its logic: all / any). */
export function isTargetVisible(type: string, id: string, sets: SnapshotConditionSet[], ctx: Record<string, string>): boolean {
  const mine = sets.filter((s) => s.targetType === type && s.targetId === id);
  return mine.every((s) => {
    const results = s.conditions.map((c) => passes(c.field, c.operator, c.value, ctx));
    return s.logic === 'any' ? results.some(Boolean) : results.every(Boolean);
  });
}

/** A choice staff can pick: not words, not a link, not coming soon. */
export function isSelectable(choice: SnapshotChoice): boolean {
  return !choice.comingSoon && (choice.choiceType === 'standard' || choice.choiceType === 'colour' || choice.choiceType === 'product');
}

/** The steps as they stand for these picks: hidden steps, groups and choices removed. */
export function visibleSteps(snapshot: Pick<ConfiguratorSnapshot, 'steps' | 'conditionSets'>, selections: ConfiguratorSelections): SnapshotStep[] {
  const sets = snapshot.conditionSets ?? [];
  const ctx = buildEvalContext(snapshot.steps, selections);
  const show = (type: string, id: string) => isTargetVisible(type, id, sets, ctx);
  return snapshot.steps
    .filter((s) => show('step', s.id))
    .map((s) => ({
      ...s,
      groups: s.groups
        .filter((g) => g.displayStyle !== 'hidden' && show('choice_group', g.id))
        .map((g) => ({ ...g, choices: g.choices.filter((c) => show('choice', c.id)) }))
        .filter((g) => g.choices.length > 0),
    }))
    .filter((s) => s.groups.length > 0);
}

/** A required group needs a pick only when it has something pickable. */
export function groupNeedsPick(group: SnapshotGroup): boolean {
  return group.isRequired && group.choices.some(isSelectable);
}

export function stepComplete(step: SnapshotStep, selections: ConfiguratorSelections): boolean {
  return step.groups.filter(groupNeedsPick).every((g) => (selections[g.id]?.length ?? 0) > 0);
}

/**
 * Drops picks that are no longer visible (an earlier change hid them), repeating
 * until stable since one hidden pick can hide another.
 */
export function pruneSelections(snapshot: Pick<ConfiguratorSnapshot, 'steps' | 'conditionSets'>, selections: ConfiguratorSelections): ConfiguratorSelections {
  let current = selections;
  for (let i = 0; i < 5; i++) {
    const visible = new Set(visibleSteps(snapshot, current).flatMap((s) => s.groups.flatMap((g) => g.choices.map((c) => `${g.id}:${c.id}`))));
    const next: ConfiguratorSelections = {};
    let changed = false;
    for (const [groupId, ids] of Object.entries(current)) {
      const kept = ids.filter((id) => visible.has(`${groupId}:${id}`));
      if (kept.length !== ids.length) changed = true;
      if (kept.length) next[groupId] = kept;
    }
    if (!changed) return current;
    current = next;
  }
  return current;
}

/** Each single-choice group's default (or only selectable) choice, for groups with nothing picked. */
export function defaultSelections(snapshot: Pick<ConfiguratorSnapshot, 'steps'>): ConfiguratorSelections {
  const out: ConfiguratorSelections = {};
  for (const step of snapshot.steps) {
    for (const g of step.groups) {
      const pickable = g.choices.filter(isSelectable);
      const def = pickable.find((c) => (c as SnapshotChoice & { isDefault?: boolean }).isDefault) ?? (g.isRequired && pickable.length === 1 ? pickable[0] : undefined);
      if (def) out[g.id] = [def.id];
    }
  }
  return out;
}

/** Text for a bilingual-or-string field. */
export function t(v: { en?: string; fr?: string } | string | null | undefined): string {
  if (!v) return '';
  return typeof v === 'string' ? v : v.en ?? v.fr ?? '';
}

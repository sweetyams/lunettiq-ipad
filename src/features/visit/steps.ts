/**
 * The visit spine (V2 WS1): one ordered set of steps a stylist walks with a client.
 * Pure definitions — the step rail and the visit screen render from these, and the
 * current step is persisted in useSessionStore so a visit resumes after a restart.
 */
export const VISIT_STEPS = ['welcome', 'file', 'lifestyle', 'frames', 'quote', 'close'] as const;
export type VisitStep = (typeof VISIT_STEPS)[number];

export const VISIT_PURPOSES = ['glasses', 'sunglasses', 'contacts', 'exam', 'adjustment', 'pickup'] as const;
export type VisitPurpose = (typeof VISIT_PURPOSES)[number];

export interface StepFacts {
  purposes: VisitPurpose[];
  hasContact: boolean;
  hasRx: boolean;
  hasFit: boolean;
  hasLifestyle: boolean;
  framesTried: number;
  loved: number;
}

/**
 * Sunglasses-only visits (no prescription glasses, no contacts, no exam) take the
 * sun path: the prescription is optional (gap checklist: split sun / optical intake).
 */
export function isSunPath(purposes: VisitPurpose[]): boolean {
  return purposes.includes('sunglasses') && !purposes.some((p) => p === 'glasses' || p === 'contacts' || p === 'exam');
}

/** A step is "done" when what it's for is on file — never blocks moving on. */
export function stepDone(step: VisitStep, f: StepFacts): boolean {
  switch (step) {
    case 'welcome': return f.purposes.length > 0;
    case 'file': return f.hasContact && (f.hasRx || isSunPath(f.purposes));
    case 'lifestyle': return f.hasLifestyle;
    case 'frames': return f.framesTried > 0;
    case 'quote': return f.loved > 0;
    case 'close': return false;
  }
}

export function nextStep(step: VisitStep): VisitStep | null {
  const i = VISIT_STEPS.indexOf(step);
  return VISIT_STEPS[i + 1] ?? null;
}

export function prevStep(step: VisitStep): VisitStep | null {
  const i = VISIT_STEPS.indexOf(step);
  return i > 0 ? VISIT_STEPS[i - 1]! : null;
}

/**
 * Where a visit should open: pickups and adjustments go straight to frames-free work
 * (close); everything else starts at Welcome.
 */
export function firstStepFor(purposes: VisitPurpose[]): VisitStep {
  if (purposes.length && purposes.every((p) => p === 'pickup' || p === 'adjustment')) return 'close';
  return 'welcome';
}

import { describe, it, expect } from 'vitest';
import { VISIT_STEPS, nextStep, prevStep, stepDone, firstStepFor, type StepFacts } from '@/src/features/visit/steps';

const facts = (over: Partial<StepFacts> = {}): StepFacts => ({
  purposes: [], hasContact: false, hasRx: false, hasFit: false, hasLifestyle: false, framesTried: 0, loved: 0, ...over,
});

describe('visit spine', () => {
  it('walks Welcome → File → Lifestyle → Frames → Quote → Close', () => {
    expect(VISIT_STEPS).toEqual(['welcome', 'file', 'lifestyle', 'frames', 'quote', 'close']);
    expect(nextStep('frames')).toBe('quote');
    expect(nextStep('close')).toBeNull();
    expect(prevStep('welcome')).toBeNull();
    expect(prevStep('file')).toBe('welcome');
  });

  it('marks steps done from what is on file, never Close', () => {
    expect(stepDone('welcome', facts({ purposes: ['glasses'] }))).toBe(true);
    expect(stepDone('file', facts({ hasContact: true }))).toBe(false);
    expect(stepDone('file', facts({ hasContact: true, hasRx: true }))).toBe(true);
    expect(stepDone('frames', facts({ framesTried: 2 }))).toBe(true);
    expect(stepDone('quote', facts({ framesTried: 2, loved: 0 }))).toBe(false);
    expect(stepDone('close', facts({ purposes: ['glasses'], framesTried: 9, loved: 9 }))).toBe(false);
  });

  it('pickups and adjustments skip to Close', () => {
    expect(firstStepFor(['pickup'])).toBe('close');
    expect(firstStepFor(['adjustment', 'pickup'])).toBe('close');
    expect(firstStepFor(['pickup', 'glasses'])).toBe('welcome');
    expect(firstStepFor([])).toBe('welcome');
  });
});

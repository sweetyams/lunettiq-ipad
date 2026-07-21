---
name: simmer
description: "Iterative artifact refinement — takes any text and hones it over multiple rounds using criteria-driven scoring"
arguments:
  - name: artifact
    description: "File path or pasted content to refine"
    required: true
  - name: iterations
    description: "Number of refinement rounds (default: 3)"
    required: false
---

Simmer: iterative refinement of {{artifact}}.

## Protocol

### Phase 1 — Setup
1. Read the artifact (file path or pasted content)
2. Elicit 2-3 quality criteria from user (or use suggested defaults)
3. Confirm iterations (default: 3)

### Phase 2 — Seed Judgment
1. Score the seed 1-10 per criterion
2. Produce first ASI (Actionable Single Improvement — one paragraph, specific, cites concrete issues)

### Phase 3 — Refinement Loop (per iteration)
- **Generate:** Follow the ASI, produce improved version
- **Judge:** Score against criteria, produce next ASI
- **Reflect:** Update trajectory, track best-so-far

### Phase 4 — Handoff
After N iterations: present best version. User can accept, continue, or stop.

## ASI Format

One paragraph. Specific and actionable. Cites concrete issues in the artifact. Not a list — a single coherent improvement direction.

## Regression Safety

Track best-so-far. If a round regresses, the next iteration starts from the best candidate, not the regressed version.

## Suggested Criteria

| Artifact Type | Default Criteria |
|---|---|
| Steering rule | clarity, actionability, agent-interpretability |
| Code | correctness, readability, performance |
| Documentation | accuracy, scannability, example quality |
| Schema/config | completeness, constraint balance, extensibility |
| Prose/copy | clarity, conciseness, voice consistency |

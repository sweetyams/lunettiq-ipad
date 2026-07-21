## Method Card: Enforce Prevention Alongside Fix

**Type:** decision
**Confidence:** high
**Scope:** project-wide

### Trigger
When fixing a class of bug that could recur in new code (not just a one-off typo).

### Observed User Move
"Make abandon and all cancel actions foundry modals not browser — add steering to hard stop this happening." Fixed the instances AND added: steering rule, lint pattern with hard-error flag. Three layers: fix existing code, document the rule, automate enforcement.

### Underlying Principle
A fix without enforcement is temporary. The next developer (or agent) will re-introduce the same class of error because they don't know the rule exists. Prevention must be automatic.

### Applies When
- A pattern violation is found in multiple files (signals it's a recurring mistake)
- The fix is mechanical and the rule is expressible as a lint/grep pattern
- The steering docs don't already cover it explicitly

### Reasoning
Three layers of prevention, each catching different failure modes:
1. **Steering doc** — catches agents reading context before generating code
2. **Lint rule** — catches code that slips past the agent
3. **Pre-commit hook** — catches anything that slips past the lint in IDE

### Future Agent Behaviour
When fixing a class-level bug: (1) fix all existing instances, (2) add a steering rule in the relevant doc, (3) add a lint pattern if the violation is grep-detectable. Report all three in the summary.

### Counterbalance
Not every bug is a class. A one-off typo doesn't need a lint rule. The overhead of enforcement (new lint patterns, steering bloat) must be proportional to the recurrence risk.

### Risk If Overused
Lint rule explosion — hundreds of specific rules that slow CI and create false positives. Each rule should catch a broad category, not a single instance.

### Trigger Questions
- Did this bug appear in more than 2 files?
- Could a future agent reasonably make the same mistake?
- Can I express the violation as a regex or AST pattern?

### Evidence
Session 2026-06-03: 5 instances of `window.confirm()` across inventory. Fix: replaced all with `<Confirm>`. Prevention: steering rule in 08-frontend-admin.md + `pattern/no-browser-confirm` lint rule with `hardError: true`.

### Do Not Overapply
One-off bugs, performance issues (can't lint for "slow"), design taste (can't lint for "ugly").

### Decay / Review
Stable. Core engineering practice. Review only if lint rules become unwieldy.

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-06-03 | browser-dialogs | Reinforced | Original |
| 2026-06-05 | inventory-count-verification | Reinforced | After fixing count data, user immediately asked "so next count this will save properly?" and demanded code fixes alongside data fixes. One-time correction without code fix = unacceptable. |
| 2026-06-08 | projection-quality-audit | Reinforced | Canonical products had duplicate rows → fix: (1) dedup migration (fix existing), (2) unique index (DB enforcement), (3) ON CONFLICT guard in application code (prevent at write time). Three layers ensuring the same class of bug cannot recur. |
| 2026-06-09 | dirty-state-consolidation | Reinforced | Products page crashed from temporal dead zone in dirty state. Fix: (1) create `useDirtyState` hook (abstraction), (2) migrate all 20 pages (fix existing), (3) add steering rule "Never use raw useState for dirty" (prevent future). Same three-layer pattern: fix, consolidate, document. |
| 2026-06-09 | pipeline-gap-analysis | Reinforced | No bug to fix, but same layered thinking applied to CI: (1) dep audit blocks supply chain vulns, (2) build step blocks broken deploys, (3) Slack alerting closes detection→action gap. Three layers of automated enforcement. |

### Graduation
Graduated to steering `#82-working-method-digest` pattern #7 (2026-06-09). Card retained for full evidence history.

### Related Patterns
- [Layer Prevention by Specificity](../reasoning/layer-prevention-by-specificity.md) — the HOW: specific/fast checks for known patterns, general/thorough for unknown
- [Three-Layer Enforcement Ladder](../reasoning/three-layer-enforcement-ladder.md) — the ladder: expressible → computable → enforceable
- [One-Time Fix Not Becoming Mechanism](../anti-pattern/one-time-fix-not-becoming-mechanism.md) — the failure mode: fix scripts that don't handle tomorrow's data

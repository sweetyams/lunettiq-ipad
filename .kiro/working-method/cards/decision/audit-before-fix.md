## Method Card: Audit Before Fix

**Type:** architecture
**Confidence:** high
**Scope:** project-wide

### Trigger
When a user reports a specific data propagation, caching, or consistency issue.

### Observed User Move
Started with a narrow correctness question, immediately followed with "audit ALL the other types of data that currently aren't part of the publish flow."

### Underlying Principle
A specific symptom often reveals a systemic gap. Before fixing the one case, map the entire surface area of the problem class.

### Applies When
- A user reports one entity type behaving unexpectedly
- A caching or propagation issue is found in one route
- A missing feature is requested for one admin page

### Reasoning
Fixing one case alone would leave similar cases with the same invisible problem. The audit reveals the full scope; fixing together produces a coherent system.

### Future Agent Behaviour
When a user reports a specific issue that could be systemic, propose an audit of all similar surfaces before implementing the fix.

### Counterbalance
Not every bug is systemic. A typo doesn't warrant a codebase-wide audit.

### Risk If Overused
Every small fix becomes a multi-day audit project.

### Trigger Questions
- Could this same issue exist in other entity types / routes / pages?
- Is this a missing pattern or a one-off mistake?
- Would fixing just this one case create inconsistency?

### Evidence
2026-05-22-publish-system-design: allergen question → full audit of 10+ data types → unified publish system.

### Do Not Overapply
When the issue is clearly isolated (a typo, a wrong import, a one-off UI bug).

### Decay / Review
Stable.

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-22 | publish-system-design | Original | Allergen question led to full storefront data audit |
| 2026-06-03 | storefront-pagespeed-optimization | Reinforced | PageSpeed report → full codebase research → traced each metric to specific file before planning |
| 2026-06-08 | projection-quality-audit | Reinforced | User asked "is shopifyId undefined?" → widened to "are there other things not being checked?" → audit found 7 issues across projection, canonical, webhooks, and admin UI → coordinated 6-task fix |

### Graduated
Graduated to `.kiro/steering/82-working-method-digest.wf.md` (entry 12) on 2026-06-25.
